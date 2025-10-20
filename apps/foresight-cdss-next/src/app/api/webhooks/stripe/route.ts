import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeUpdate } from "@/lib/aws/database";
import { eq, and } from "drizzle-orm";
import { 
  organizations, 
  analyticsEvents, 
  notificationTemplates, 
  notifications, 
  workQueues,
  teamMembers
} from "@foresight-cdss-next/db";

// Define AWS schema compatible types
export type RecurringPlanType = "starter" | "professional" | "enterprise" | "basic";
export type OrganizationStatus = "active" | "trial" | "suspended" | "cancelled";
export type EventCategory = "financial" | "usage" | "system" | "user";
export type NotificationCategory = "billing" | "security" | "system" | "user";

// Environment variable checks
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
}

// Initialize Stripe with correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Use current stable API version
});

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header found');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Log the event for monitoring
  console.log(`Webhook received: ${event.type}`, {
    eventId: event.id,
    created: event.created,
  });

  try {
    // Handle different event types
    switch (event.type) {
      // === Subscription Lifecycle Events ===
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'customer.subscription.paused': {
        const subscription = event.data.object;
        await handleSubscriptionPaused(subscription);
        break;
      }

      case 'customer.subscription.resumed': {
        const subscription = event.data.object;
        await handleSubscriptionResumed(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        await handleTrialEndingSoon(subscription);
        break;
      }

      // === Payment Events ===
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription: Stripe.Subscription };
        await handleFailedPayment(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription: Stripe.Subscription };
        await handleSuccessfulPayment(invoice);
        break;
      }

      case 'invoice.payment_action_required': {
        const invoice = event.data.object;
        await handlePaymentActionRequired(invoice);
        break;
      }

      // === Customer Events ===
      case 'customer.updated': {
        const customer = event.data.object;
        await handleCustomerUpdate(customer);
        break;
      }

      // === Dispute Events ===
      case 'charge.dispute.created': {
        const dispute = event.data.object;
        await handleDispute(dispute);
        break;
      }

      // === Checkout Session Events (for Clerk Billing) ===
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      default:
        // Log unhandled events for monitoring
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Log to your error tracking service (e.g., Sentry)
    await logWebhookError(event.type, error);

    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Stripe from retrying
    return NextResponse.json(
      { error: 'Webhook processing failed', received: true },
      { status: 200 }
    );
  }
}

// === Main Handler Functions ===

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { customer, status, items, metadata } = subscription;

  // Get the Clerk organization ID
  // Clerk stores this in the subscription metadata when using Clerk Billing
  const clerkOrgId = metadata?.organizationId ||
    metadata?.clerk_organization_id ||
    (await getCustomerMetadata(customer as string))?.organizationId;

  if (!clerkOrgId) {
    console.error('No Clerk organization ID found for subscription:', subscription.id);
    // You might want to create an alert for your team
    await createManualReviewAlert('subscription_missing_org', subscription.id);
    return;
  }

  // Find the organization by Clerk organization ID
  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ 
      id: organizations.id
    })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) {
    console.error('No organization found for Clerk org:', clerkOrgId);
    await createManualReviewAlert('organization_not_found', subscription.id);
    return;
  }

  const organizationData = organization as { id: string; status: string };
  const organizationId = organizationData.id;

  // Map Stripe subscription status to organization status
  const orgStatus = mapStripeStatusToOrgStatus(status);
  const planType = (await extractPlanType(items)) as RecurringPlanType;

  // Update organization record - store all billing info in settings JSON field
  const { error: updateError } = await safeUpdate(async () =>
    db.update(organizations)
      .set({
        updatedAt: new Date(),
        // Store all subscription metadata in settings
        settings: {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: typeof customer === 'string' ? customer : customer.id,
          stripe_price_id: items.data[0]?.price.id,
          stripe_product_id: typeof items.data[0]?.price.product === 'string' ? items.data[0]?.price.product : items.data[0]?.price.product.id,
          billing_interval: items.data[0]?.price.recurring?.interval,
          // Store billing status and plan info in settings
          status: orgStatus,
          planType: planType,
          trialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        },
      })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id })
  );

  if (updateError) {
    console.error('Error updating organization:', updateError);
    throw updateError; // This will be caught and logged
  }

  // Log analytics event
  await logAnalyticsEvent(organizationId, 'subscription_updated', {
    stripe_status: status,
    plan_type: planType,
    subscription_id: subscription.id,
    previous_status: subscription.metadata?.previous_status,
  });

  // Handle status-specific actions
  if (status === 'active' && subscription.metadata?.previous_status === 'trialing') {
    await handleTrialConversion(organizationId, subscription);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId ||
    subscription.metadata?.clerk_organization_id ||
    (await getCustomerMetadata(subscription.customer as string))?.organizationId;

  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  // Update organization status to cancelled in settings
  await safeUpdate(async () =>
    db.update(organizations)
      .set({
        updatedAt: new Date(),
        settings: {
          status: 'cancelled',
        },
      })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id })
  );

  // Create work queue item for offboarding
  await safeInsert(async () =>
    db.insert(workQueues)
      .values({
        organizationId: organizationId,
        entityType: 'organization',
        entityId: organizationId,
        title: 'Subscription Cancelled - Offboarding Required',
        description: `Customer subscription has been cancelled. Begin offboarding process. Subscription ID: ${subscription.id}`,
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
  );

  // Send cancellation notification
  await sendNotification(organizationId, 'subscription_cancelled', {
    subscription_id: subscription.id,
    effective_date: (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null,
  });
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  await safeUpdate(async () =>
    db.update(organizations)
      .set({
        updatedAt: new Date(),
        settings: {
          status: 'suspended',
        },
      })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id })
  );

  await logAnalyticsEvent(organizationId, 'subscription_paused', {
    subscription_id: subscription.id,
  });
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  await safeUpdate(async () =>
    db.update(organizations)
      .set({
        updatedAt: new Date(),
        settings: {
          status: 'active',
        },
      })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id })
  );

  await logAnalyticsEvent(organizationId, 'subscription_resumed', {
    subscription_id: subscription.id,
  });
}

async function handleTrialEndingSoon(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // Create notification for trial ending
  await sendNotification(organizationId, 'trial_ending', {
    trial_end_date: trialEndDate?.toISOString(),
    days_remaining: trialEndDate
      ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0,
  });
}

async function handleTrialConversion(organizationId: string, subscription: Stripe.Subscription) {
  await logAnalyticsEvent(organizationId, 'trial_converted', {
    subscription_id: subscription.id,
    plan_type: await extractPlanType(subscription.items),
  });

  await sendNotification(organizationId, 'trial_converted', {
    plan_name: subscription.items.data[0]?.price.nickname || 'Premium',
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice & { subscription: Stripe.Subscription }) {
  const subscription = invoice.subscription;
  if (!subscription) return;

  const clerkOrgId = invoice.metadata?.organizationId ||
    invoice.metadata?.clerk_organization_id;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  // Log failed payment
  await logAnalyticsEvent(organizationId, 'payment_failed', {
    invoice_id: invoice.id,
    amount: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt,
  });

  // Create alert for billing team
  await safeInsert(async () =>
    db.insert(workQueues).values({
      organizationId: organizationId,
      entityType: 'payment',
      entityId: invoice.id,
      title: 'Payment Failed',
      description: `Payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Attempt ${invoice.attempt_count}. Invoice: ${invoice.id}`,
      priority: 'high',
      status: 'pending',
    })
  );

  // Send notification to organization
  await sendNotification(organizationId, 'payment_failed', {
    amount: (invoice.amount_due / 100).toFixed(2),
    attempt_count: invoice.attempt_count,
    hosted_invoice_url: invoice.hosted_invoice_url,
  });

  // If this is the final attempt, prepare for suspension
  if (invoice.attempt_count >= 3) {
    await prepareSuspension(organizationId, invoice);
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice & { subscription: Stripe.Subscription }) {
  const clerkOrgId = invoice.metadata?.organizationId ||
    invoice.metadata?.clerk_organization_id;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  // Log successful payment
  await logAnalyticsEvent(organizationId, 'payment_succeeded', {
    invoice_id: invoice.id,
    amount: invoice.amount_paid,
    subscription_id: invoice.subscription ? (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id) : null,
  });

  // Always update organization to active status on successful payment
  await safeUpdate(async () =>
    db.update(organizations)
      .set({
        updatedAt: new Date(),
        settings: {
          status: 'active',
        },
      })
      .where(eq(organizations.id, organizationId))
      .returning({ id: organizations.id })
  );

  // Notify organization that access has been restored
  await sendNotification(organizationId, 'access_restored', {
    invoice_id: invoice.id,
  });

  // Clear any payment failure work items
  await safeUpdate(async () =>
    db.update(workQueues)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(and(
        eq(workQueues.organizationId, organizationId),
        eq(workQueues.entityType, 'payment'),
        eq(workQueues.status, 'pending')
      ))
      .returning({ id: workQueues.id })
  );
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  const clerkOrgId = invoice.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  await sendNotification(organizationId, 'payment_action_required', {
    hosted_invoice_url: invoice.hosted_invoice_url,
    amount: (invoice.amount_due / 100).toFixed(2),
  });
}

async function handleCustomerUpdate(customer: Stripe.Customer) {
  const clerkOrgId = customer.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  // Update organization with new customer info if relevant
  await logAnalyticsEvent(organizationId, 'customer_updated', {
    customer_id: customer.id,
    email: customer.email,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // This is important for Clerk Billing integration
  const clerkOrgId = session.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  await logAnalyticsEvent(organizationId, 'checkout_completed', {
    session_id: session.id,
    amount: session.amount_total,
    subscription: session.subscription,
  });
}

async function handleDispute(dispute: Stripe.Dispute) {
  console.error('Payment dispute created:', dispute.id);

  // Find the related organization
  const charge = await stripe.charges.retrieve(dispute.charge as string);
  const customer = charge.customer;

  if (!customer) return;

  const customerData = await stripe.customers.retrieve(customer as string);
  if ('deleted' in customerData && customerData.deleted) return;

  const clerkOrgId = customerData.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { db } = await createAuthenticatedDatabaseClient();
  
  const { data: organization } = await safeSingle(async () =>
    db.select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
  );

  if (!organization) return;

  const organizationId = (organization as { id: string }).id;

  // Create high-priority work item
  await safeInsert(async () =>
    db.insert(workQueues).values({
      organizationId: organizationId,
      entityType: 'dispute',
      entityId: dispute.id,
      title: `Payment Dispute - $${(dispute.amount / 100).toFixed(2)}`,
      description: `A payment dispute has been initiated. Response required by ${new Date((dispute.evidence_details?.due_by ?? 0) * 1000).toLocaleDateString()}. Dispute ID: ${dispute.id}`,
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date((dispute.evidence_details?.due_by ?? 0) * 1000),
    })
  );
}

// === Helper Functions ===

async function getCustomerMetadata(customerId: string): Promise<any> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ('deleted' in customer && customer.deleted) return null;
    return customer.metadata;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

function mapStripeStatusToOrgStatus(stripeStatus: Stripe.Subscription.Status): OrganizationStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
    case 'unpaid':
      return 'suspended';
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled';
    case 'incomplete':
    case 'paused':
      return 'suspended';
    default:
      return 'active';
  }
}

async function extractPlanType(items: Stripe.ApiList<Stripe.SubscriptionItem>): Promise<string> {
  const firstItem = items.data[0];
  if (!firstItem) return 'basic';

  const productId = firstItem.price.product as string;

  try {
    // Fetch product details for more accurate plan mapping
    const product = await stripe.products.retrieve(productId);

    // Use product metadata or name to determine plan type
    if (product.metadata?.plan_type) {
      return product.metadata.plan_type;
    }

    // Fallback to name-based detection
    const name = product.name.toLowerCase();
    if (name.includes('enterprise')) return 'enterprise';
    if (name.includes('professional') || name.includes('pro')) return 'professional';
    if (name.includes('starter')) return 'starter';

    return 'basic';
  } catch (error) {
    console.error('Error fetching product:', error);

    // Fallback mapping
    const planMap: Record<string, string> = {
      'prod_starter': 'starter',
      'prod_professional': 'professional',
      'prod_enterprise': 'enterprise',
    };

    return planMap[productId] || 'basic';
  }
}

async function logAnalyticsEvent(
  organizationId: string,
  eventName: string,
  eventData: Record<string, any>
) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();
    await safeInsert(async () =>
      db.insert(analyticsEvents).values({
        organizationId: organizationId,
        eventName: eventName,
        category: "business_metric",
        properties: eventData,
      })
    );
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
}

async function sendNotification(
  organizationId: string,
  type: string,
  metadata: Record<string, any>
) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();
    
    // Get notification template - simplified for AWS schema compatibility
    const { data: template } = await safeSingle(async () =>
      db.select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.isActive, true))
      .limit(1)
    );

    if (!template) {
      console.log('No active template for notification type:', type);
      return;
    }

    const templateData = template as {
      id: string;
      subject: string | null;
      body: string;
    };

    // Get a team member for the organization (simplified - use first active member)
    const { data: teamMember } = await safeSingle(async () =>
      db.select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.organizationId, organizationId))
        .limit(1)
    );

    if (!teamMember) {
      console.log('No team member found for organization:', organizationId);
      return;
    }

    // Create notification
    await safeInsert(async () =>
      db.insert(notifications).values({
        organizationId: organizationId,
        teamMemberId: (teamMember as { id: string }).id,
        type: "email", // Default to email notification type
        subject: templateData.subject || `Billing notification: ${type}`,
        message: templateData.body || JSON.stringify(metadata),
        recipient: "billing@organization.com", // Default billing email
        templateId: templateData.id,
      })
    );
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function createManualReviewAlert(
  alertType: string,
  entityId: string
) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();
    
    // Create an internal alert for your team to review
    await safeInsert(async () =>
      db.insert(workQueues).values({
        organizationId: process.env.INTERNAL_ORGANIZATION_ID || 'internal',
        entityType: 'webhook_issue',
        entityId: entityId,
        title: `Webhook Issue: ${alertType}`,
        description: `Manual review required for ${alertType} on entity ${entityId}`,
        priority: 'medium',
        status: 'pending',
      })
    );
  } catch (error) {
    console.error('Error creating manual review alert:', error);
  }
}

async function prepareSuspension(organizationId: string, invoice: Stripe.Invoice) {
  const { db } = await createAuthenticatedDatabaseClient();
  await safeInsert(async () =>
    db.insert(workQueues).values({
      organizationId: organizationId,
      entityType: 'suspension',
      entityId: invoice.id,
      title: 'Account Suspension Pending',
      description: 'Multiple payment attempts have failed. Account will be suspended if payment is not received.',
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })
  );
}

async function logWebhookError(eventType: string, error: any) {
  console.error(`Webhook error for ${eventType}:`, error);

  // Send this to Sentry or another error tracking service
  // Example with Sentry:
  // Sentry.captureException(error, {
  //   tags: { webhook_event: eventType },
  // });
}

// Export config for Next.js
export const runtime = 'nodejs'; // Use Node.js runtime for better Stripe SDK compatibility

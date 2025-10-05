import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

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

  // Find the team by Clerk organization ID
  const { data: syncRecord, error: syncError } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (syncError || !syncRecord?.team_id) {
    console.error('No team found for organization:', clerkOrgId, syncError);
    await createManualReviewAlert('team_not_found', subscription.id);
    return;
  }

  const teamId = syncRecord.team_id;

  // Map Stripe subscription status to your team status
  const teamStatus = mapStripeStatusToTeamStatus(status);
  const planType = await extractPlanType(items);

  // Update team record
  const { error: updateError } = await supabaseAdmin
    .from('team')
    .update({
      status: teamStatus,
      plan_type: planType,
      updated_at: new Date().toISOString(),
      // Store trial end if applicable
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      // Store subscription metadata
      settings: {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: typeof customer === 'string' ? customer : customer.id,
        stripe_price_id: items.data[0]?.price.id,
        stripe_product_id: typeof items.data[0]?.price.product === 'string' ? items.data[0]?.price.product : items.data[0]?.price.product.id,
        billing_interval: items.data[0]?.price.recurring?.interval,
      },
    })
    .eq('id', teamId);

  if (updateError) {
    console.error('Error updating team:', updateError);
    throw updateError; // This will be caught and logged
  }

  // Log analytics event
  await logAnalyticsEvent(teamId, 'subscription_updated', {
    stripe_status: status,
    plan_type: planType,
    subscription_id: subscription.id,
    previous_status: subscription.metadata?.previous_status,
  });

  // Handle status-specific actions
  if (status === 'active' && subscription.metadata?.previous_status === 'trialing') {
    await handleTrialConversion(teamId, subscription);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId ||
    subscription.metadata?.clerk_organization_id ||
    (await getCustomerMetadata(subscription.customer as string))?.organizationId;

  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  const teamId = syncRecord.team_id;

  // Update team status to cancelled
  await supabaseAdmin
    .from('team')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId);

  // Create work queue item for offboarding
  await supabaseAdmin
    .from('work_queue')
    .insert({
      team_id: teamId,
      entity_type: 'team',
      entity_id: teamId,
      queue_type: 'subscription_cancellation',
      title: 'Subscription Cancelled - Offboarding Required',
      description: 'Customer subscription has been cancelled. Begin offboarding process.',
      priority: 2,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      metadata: {
        subscription_id: subscription.id,
        cancel_at: subscription.cancel_at,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancellation_details: JSON.stringify(subscription.cancellation_details),
      },
    });

  // Send cancellation notification
  await sendNotification(teamId, 'subscription_cancelled', {
    subscription_id: subscription.id,
    effective_date: (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null,
  });
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  await supabaseAdmin
    .from('team')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', syncRecord.team_id);

  await logAnalyticsEvent(syncRecord.team_id, 'subscription_paused', {
    subscription_id: subscription.id,
  });
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  await supabaseAdmin
    .from('team')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', syncRecord.team_id);

  await logAnalyticsEvent(syncRecord.team_id, 'subscription_resumed', {
    subscription_id: subscription.id,
  });
}

async function handleTrialEndingSoon(subscription: Stripe.Subscription) {
  const clerkOrgId = subscription.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // Create notification for trial ending
  await sendNotification(syncRecord.team_id, 'trial_ending', {
    trial_end_date: trialEndDate?.toISOString(),
    days_remaining: trialEndDate
      ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0,
  });
}

async function handleTrialConversion(teamId: string, subscription: Stripe.Subscription) {
  await logAnalyticsEvent(teamId, 'trial_converted', {
    subscription_id: subscription.id,
    plan_type: await extractPlanType(subscription.items),
  });

  await sendNotification(teamId, 'trial_converted', {
    plan_name: subscription.items.data[0]?.price.nickname || 'Premium',
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice & { subscription: Stripe.Subscription }) {
  const subscription = invoice.subscription;
  if (!subscription) return;

  const clerkOrgId = invoice.metadata?.organizationId ||
    invoice.metadata?.clerk_organization_id;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  const teamId = syncRecord.team_id;

  // Log failed payment
  await logAnalyticsEvent(teamId, 'payment_failed', {
    invoice_id: invoice.id,
    amount: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt,
  });

  // Create alert for billing team
  await supabaseAdmin
    .from('work_queue')
    .insert({
      team_id: teamId,
      entity_type: 'payment',
      entity_id: invoice.id,
      queue_type: 'payment_failure',
      title: 'Payment Failed',
      description: `Payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Attempt ${invoice.attempt_count}`,
      priority: 1,
      status: 'pending',
      auto_escalate: invoice.attempt_count > 2, // Escalate after 2 failed attempts
      metadata: {
        invoice_id: invoice.id,
        customer_id: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
        amount: invoice.amount_due,
        attempt_count: invoice.attempt_count,
        next_attempt: invoice.next_payment_attempt,
      },
    });

  // Send notification to team
  await sendNotification(teamId, 'payment_failed', {
    amount: (invoice.amount_due / 100).toFixed(2),
    attempt_count: invoice.attempt_count,
    hosted_invoice_url: invoice.hosted_invoice_url,
  });

  // If this is the final attempt, prepare for suspension
  if (invoice.attempt_count >= 3) {
    await prepareSuspension(teamId, invoice);
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice & { subscription: Stripe.Subscription }) {
  const clerkOrgId = invoice.metadata?.organizationId ||
    invoice.metadata?.clerk_organization_id;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  const teamId = syncRecord.team_id;

  // Log successful payment
  await logAnalyticsEvent(teamId, 'payment_succeeded', {
    invoice_id: invoice.id,
    amount: invoice.amount_paid,
    subscription_id: String(invoice.subscription),
  });

  // Update team status if it was suspended
  const { data: currentTeam } = await supabaseAdmin
    .from('team')
    .select('status')
    .eq('id', teamId)
    .single();

  if (currentTeam?.status === 'suspended') {
    await supabaseAdmin
      .from('team')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId);

    // Notify team that access has been restored
    await sendNotification(teamId, 'access_restored', {
      invoice_id: invoice.id,
    });
  }

  // Clear any payment failure work items
  await supabaseAdmin
    .from('work_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('team_id', teamId)
    .eq('queue_type', 'payment_failure')
    .eq('status', 'pending');
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  const clerkOrgId = invoice.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  await sendNotification(syncRecord.team_id, 'payment_action_required', {
    hosted_invoice_url: invoice.hosted_invoice_url,
    amount: (invoice.amount_due / 100).toFixed(2),
  });
}

async function handleCustomerUpdate(customer: Stripe.Customer) {
  const clerkOrgId = customer.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  // Update team with new customer info if relevant
  await logAnalyticsEvent(syncRecord.team_id, 'customer_updated', {
    customer_id: customer.id,
    email: customer.email,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // This is important for Clerk Billing integration
  const clerkOrgId = session.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  await logAnalyticsEvent(syncRecord.team_id, 'checkout_completed', {
    session_id: session.id,
    amount: session.amount_total,
    subscription: session.subscription,
  });
}

async function handleDispute(dispute: Stripe.Dispute) {
  console.error('Payment dispute created:', dispute.id);

  // Find the related team
  const charge = await stripe.charges.retrieve(dispute.charge as string);
  const customer = charge.customer;

  if (!customer) return;

  const customerData = await stripe.customers.retrieve(customer as string);
  if ('deleted' in customerData && customerData.deleted) return;

  const clerkOrgId = customerData.metadata?.organizationId;
  if (!clerkOrgId) return;

  const { data: syncRecord } = await supabaseAdmin
    .from('clerk_user_sync')
    .select('team_id')
    .eq('organization_id', clerkOrgId)
    .single();

  if (!syncRecord?.team_id) return;

  // Create high-priority work item
  await supabaseAdmin
    .from('work_queue')
    .insert({
      team_id: syncRecord.team_id,
      entity_type: 'dispute',
      entity_id: dispute.id,
      queue_type: 'payment_dispute',
      title: `Payment Dispute - $${(dispute.amount / 100).toFixed(2)}`,
      description: `A payment dispute has been initiated. Response required by ${new Date((dispute.evidence_details?.due_by ?? 0) * 1000).toLocaleDateString()}`,
      priority: 1,
      status: 'pending',
      auto_escalate: true,
      due_date: new Date((dispute.evidence_details?.due_by ?? 0) * 1000).toISOString(),
      metadata: {
        dispute_id: dispute.id,
        charge_id: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id,
        amount: dispute.amount,
        reason: dispute.reason,
        due_by: dispute.evidence_details.due_by,
      },
    });
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

function mapStripeStatusToTeamStatus(stripeStatus: Stripe.Subscription.Status): Database['public']['Enums']['team_status'] {
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
  teamId: string,
  eventName: string,
  eventData: Record<string, any>
) {
  try {
    await supabaseAdmin
      .from('analytics_event')
      .insert({
        team_id: teamId,
        event_name: eventName,
        event_category: 'billing',
        event_data: eventData,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
}

async function sendNotification(
  teamId: string,
  type: string,
  metadata: Record<string, any>
) {
  try {
    // Get notification template
    const { data: template } = await supabaseAdmin
      .from('notification_template')
      .select('*')
      .eq('event_type', type)
      .eq('is_active', true)
      .single();

    if (!template) {
      console.log('No active template for notification type:', type);
      return;
    }

    // Create notification
    await supabaseAdmin
      .from('notification')
      .insert({
        team_id: teamId,
        type: type,
        subject: template.subject || `Billing notification: ${type}`,
        body: template.body_template || JSON.stringify(metadata),
        status: 'pending',
        metadata: metadata,
        template_id: template.id,
      });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function createManualReviewAlert(
  alertType: string,
  entityId: string
) {
  try {
    // Create an internal alert for your team to review
    await supabaseAdmin
      .from('work_queue')
      .insert({
        team_id: process.env.INTERNAL_TEAM_ID || 'internal',
        entity_type: 'webhook_issue',
        entity_id: entityId,
        queue_type: 'manual_review',
        title: `Webhook Issue: ${alertType}`,
        description: `Manual review required for ${alertType} on entity ${entityId}`,
        priority: 2,
        status: 'pending',
        metadata: {
          alert_type: alertType,
          entity_id: entityId,
          timestamp: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error('Error creating manual review alert:', error);
  }
}

async function prepareSuspension(teamId: string, invoice: Stripe.Invoice) {
  await supabaseAdmin
    .from('work_queue')
    .insert({
      team_id: teamId,
      entity_type: 'suspension',
      entity_id: invoice.id,
      queue_type: 'pending_suspension',
      title: 'Account Suspension Pending',
      description: 'Multiple payment attempts have failed. Account will be suspended if payment is not received.',
      priority: 1,
      status: 'pending',
      auto_escalate: true,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });
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

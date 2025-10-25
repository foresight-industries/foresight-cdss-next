import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { twilioSMSService, smsAuthConfigs } from "@foresight-cdss-next/db";
import { createAuthenticatedDatabaseClient, safeSingle } from "@/lib/aws/database";
import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";

// Fallback webhook for Twilio SMS - simplified version with enhanced logging
export async function POST(req: Request) {
  try {
    console.log('🔄 FALLBACK: Twilio SMS webhook received - primary endpoint failed');

    // Parse the form data from Twilio
    const formData = await req.formData();
    const headersList = await headers();

    // Extract Twilio webhook data
    const webhookData = {
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string,
      MessageSid: formData.get('MessageSid') as string,
      AccountSid: formData.get('AccountSid') as string,
      FromCountry: formData.get('FromCountry') as string,
      FromState: formData.get('FromState') as string,
    };

    // Enhanced logging for fallback endpoint
    console.log('🔄 FALLBACK: Processing SMS webhook:', {
      from: webhookData.From,
      to: webhookData.To,
      messageSid: webhookData.MessageSid,
      accountSid: webhookData.AccountSid,
      bodyLength: webhookData.Body?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!webhookData.From || !webhookData.To || !webhookData.Body || !webhookData.MessageSid || !webhookData.AccountSid) {
      console.error('🔄 FALLBACK: Missing required webhook fields:', webhookData);

      // Log to monitoring service that primary webhook failed AND fallback has issues
      await logCriticalWebhookIssue('FALLBACK_MISSING_FIELDS', webhookData);

      return NextResponse.json(
        { error: 'Missing required webhook fields', source: 'fallback' },
        { status: 400 }
      );
    }

    // Optional security validation (less strict than primary)
    const twilioSignature = headersList.get('x-twilio-signature');
    if (process.env.TWILIO_AUTH_TOKEN && twilioSignature) {
      try {
        const isValid = await validateTwilioSignature(req.url, formData, twilioSignature);
        if (!isValid) {
          console.warn('🔄 FALLBACK: Invalid Twilio webhook signature - proceeding anyway');
          await logCriticalWebhookIssue('FALLBACK_INVALID_SIGNATURE', webhookData);
        }
      } catch (error) {
        console.warn('🔄 FALLBACK: Signature validation failed:', error);
        // Continue processing anyway since this is fallback
      }
    }

    // Verify the AccountSid matches a configured SMS config
    const { db } = await createAuthenticatedDatabaseClient();
    const { data: config } = await safeSingle(async () =>
      db.select({ id: smsAuthConfigs.id, organizationId: smsAuthConfigs.organizationId })
        .from(smsAuthConfigs)
        .where(eq(smsAuthConfigs.twilioAccountSid, webhookData.AccountSid))
        .limit(1)
    );

    if (!config) {
      console.warn(`🔄 FALLBACK: No SMS config found for Twilio AccountSid: ${webhookData.AccountSid}`);
      await logCriticalWebhookIssue('FALLBACK_NO_CONFIG', webhookData);

      // Return 200 to prevent Twilio retries, but don't process
      return NextResponse.json({
        received: true,
        processed: false,
        source: 'fallback',
        reason: 'no_config'
      }, { status: 200 });
    }

    // Process the SMS through the service (same as primary)
    const result = await twilioSMSService.processTwilioWebhook(webhookData);

    if (result.processed) {
      console.log(`🔄 FALLBACK: SMS OTP processed successfully:`, {
        attemptId: result.attemptId,
        otpCode: result.otpCode ? '[REDACTED]' : 'none',
        from: webhookData.From,
        messageSid: webhookData.MessageSid,
      });

      // Alert that fallback successfully handled the SMS
      await logSuccessfulFallback(webhookData, result);
    } else {
      console.log(`🔄 FALLBACK: SMS not processed (no matching OTP attempt):`, {
        from: webhookData.From,
        to: webhookData.To,
        messageSid: webhookData.MessageSid,
      });
    }

    // Always return 200 to Twilio to prevent further retries
    return NextResponse.json({
      received: true,
      processed: result.processed,
      attemptId: result.attemptId,
      source: 'fallback',
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('🔄 FALLBACK: Error processing Twilio SMS webhook:', error);

    // Critical alert - both primary and fallback failed
    await logCriticalWebhookIssue('FALLBACK_PROCESSING_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return 200 to prevent infinite Twilio retries
    return NextResponse.json({
      received: true,
      processed: false,
      source: 'fallback',
      error: 'Fallback processing error',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}

/**
 * Validates Twilio webhook signature (same as primary webhook)
 */
async function validateTwilioSignature(
  url: string,
  formData: FormData,
  signature: string
): Promise<boolean> {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!authToken) return false;

    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      params.append(key, value as string);
    }

    const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));

    let dataString = url;
    for (const [key, value] of sortedParams) {
      dataString += key + value;
    }

    const expectedSignature = createHmac('sha1', authToken)
      .update(dataString, 'utf8')
      .digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('🔄 FALLBACK: Error validating Twilio signature:', error);
    return false;
  }
}

/**
 * Logs critical webhook issues that require immediate attention
 */
async function logCriticalWebhookIssue(issueType: string, data: any): Promise<void> {
  console.error(`🚨 CRITICAL: Twilio webhook issue - ${issueType}:`, data);

  // TODO: Send to monitoring/alerting service (PagerDuty, Slack, etc.)
  // This indicates both primary and fallback webhooks are having issues

  // Example alerting integrations:
  // - Send to Slack channel: #alerts-critical
  // - Trigger PagerDuty incident
  // - Send email to engineering team
  // - Create CloudWatch alarm
}

/**
 * Logs successful fallback processing for monitoring
 */
async function logSuccessfulFallback(webhookData: any, result: any): Promise<void> {
  console.warn(`⚠️ PRIMARY WEBHOOK FAILED: Fallback successfully processed SMS`, {
    from: webhookData.From,
    to: webhookData.To,
    messageSid: webhookData.MessageSid,
    attemptId: result.attemptId,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to monitoring service to track fallback usage
  // This helps identify when primary webhook is unreliable
}

// Configure webhook endpoint for Vercel/Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

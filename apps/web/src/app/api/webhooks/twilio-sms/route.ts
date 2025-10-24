import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthenticatedDatabaseClient, safeSingle } from "@/lib/aws/database";
import { eq } from "drizzle-orm";
import { smsAuthConfigs, twilioSMSService } from "@foresight-cdss-next/db";
import { createHmac } from "node:crypto";

// Environment variable checks
if (!process.env.TWILIO_AUTH_TOKEN) {
  console.warn('TWILIO_AUTH_TOKEN not configured - webhook security validation disabled');
}

export async function POST(req: Request) {
  try {
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

    // Validate required fields
    if (!webhookData.From || !webhookData.To || !webhookData.Body || !webhookData.MessageSid || !webhookData.AccountSid) {
      console.error('Missing required webhook fields:', webhookData);
      return NextResponse.json(
        { error: 'Missing required webhook fields' },
        { status: 400 }
      );
    }

    // Security validation: Verify webhook signature if configured
    const twilioSignature = headersList.get('x-twilio-signature');
    if (process.env.TWILIO_AUTH_TOKEN && twilioSignature) {
      const isValid = await validateTwilioSignature(req.url, formData, twilioSignature);
      if (!isValid) {
        console.error('Invalid Twilio webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Log incoming webhook for monitoring
    console.log(`Twilio SMS webhook received:`, {
      from: webhookData.From,
      to: webhookData.To,
      messageSid: webhookData.MessageSid,
      accountSid: webhookData.AccountSid,
      bodyLength: webhookData.Body.length,
    });

    // Verify the AccountSid matches a configured SMS config
    const { db } = await createAuthenticatedDatabaseClient();
    const { data: config } = await safeSingle(async () =>
      db.select({ id: smsAuthConfigs.id, organizationId: smsAuthConfigs.organizationId })
        .from(smsAuthConfigs)
        .where(eq(smsAuthConfigs.twilioAccountSid, webhookData.AccountSid))
        .limit(1)
    );

    if (!config) {
      console.warn(`No SMS config found for Twilio AccountSid: ${webhookData.AccountSid}`);
      // Return 200 to prevent Twilio retries, but don't process
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // Process the SMS through the service
    const result = await twilioSMSService.processTwilioWebhook(webhookData);

    if (result.processed) {
      console.log(`SMS OTP processed successfully:`, {
        attemptId: result.attemptId,
        otpCode: result.otpCode ? '[REDACTED]' : 'none',
        from: webhookData.From,
        messageSid: webhookData.MessageSid,
      });
    } else {
      console.log(`SMS not processed (no matching OTP attempt):`, {
        from: webhookData.From,
        to: webhookData.To,
        messageSid: webhookData.MessageSid,
      });
    }

    // Always return 200 to Twilio to prevent retries
    return NextResponse.json({
      received: true,
      processed: result.processed,
      attemptId: result.attemptId,
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing Twilio SMS webhook:', error);

    // Log to error tracking service
    await logWebhookError('twilio_sms', error);

    // Return 200 to prevent Twilio retries, but log the error
    return NextResponse.json({
      received: true,
      processed: false,
      error: 'Internal processing error'
    }, { status: 200 });
  }
}

/**
 * Validates Twilio webhook signature for security
 * @param url Full webhook URL
 * @param formData Form data from request
 * @param signature X-Twilio-Signature header
 * @returns true if signature is valid
 */
async function validateTwilioSignature(
  url: string,
  formData: FormData,
  signature: string
): Promise<boolean> {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) return false;

    // Build the data string that Twilio signs
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      params.append(key, value as string);
    }

    // Sort parameters by key (Twilio requirement)
    const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));

    // Build the data string: URL + sorted parameters
    let dataString = url;
    for (const [key, value] of sortedParams) {
      dataString += key + value;
    }

    // Create HMAC-SHA1 signature
    const expectedSignature = createHmac('sha1', authToken)
      .update(dataString, 'utf8')
      .digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}

/**
 * Logs webhook errors to monitoring service
 */
async function logWebhookError(webhookType: string, error: any): Promise<void> {
  console.error(`Webhook error for ${webhookType}:`, error);

  // TODO: Send to error tracking service (Sentry, etc.)
  // Example with Sentry:
  // Sentry.captureException(error, {
  //   tags: { webhook_type: webhookType },
  // });
}

// Configure webhook endpoint for Vercel/Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

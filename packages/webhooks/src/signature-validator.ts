import { createHmac, timingSafeEqual } from 'node:crypto';

export interface WebhookValidationOptions {
  toleranceInSeconds?: number;
  requiredHeaders?: string[];
}

export interface WebhookHeaders {
  'x-foresight-signature'?: string;
  'x-foresight-timestamp'?: string;
  'x-foresight-delivery'?: string;
  'content-type'?: string;
  [key: string]: string | undefined;
}

/**
 * Webhook Signature Validator
 *
 * Validates incoming webhook signatures to ensure authenticity
 */
export class WebhookSignatureValidator {
  private defaultTolerance: number;
  private requiredHeaders: string[];

  constructor(options: WebhookValidationOptions = {}) {
    this.defaultTolerance = options.toleranceInSeconds || 300; // 5 minutes
    this.requiredHeaders = options.requiredHeaders || [
      'x-foresight-signature',
      'x-foresight-timestamp'
    ];
  }

  /**
   * Validate webhook signature
   */
  validateSignature(
    payload: string | Buffer,
    secret: string,
    headers: WebhookHeaders,
    options?: { toleranceInSeconds?: number }
  ): { valid: boolean; error?: string } {
    try {
      const signature = headers['x-foresight-signature'];
      const timestamp = headers['x-foresight-timestamp'];

      // Check required headers
      for (const header of this.requiredHeaders) {
        if (!headers[header]) {
          return { valid: false, error: `Missing required header: ${header}` };
        }
      }

      if (!signature || !timestamp) {
        return { valid: false, error: 'Missing signature or timestamp' };
      }

      // Validate timestamp
      const timestampValidation = this.validateTimestamp(
        timestamp,
        options?.toleranceInSeconds || this.defaultTolerance
      );

      if (!timestampValidation.valid) {
        return timestampValidation;
      }

      // Parse signature
      const signatureParts = signature.split('=');
      if (signatureParts.length !== 2) {
        return { valid: false, error: 'Invalid signature format' };
      }

      const [algorithm, receivedSignature] = signatureParts;

      // Validate algorithm
      if (!['sha256', 'sha1'].includes(algorithm)) {
        return { valid: false, error: `Unsupported signature algorithm: ${algorithm}` };
      }

      // Construct signed payload (timestamp + payload)
      const signedPayload = `${timestamp}.${payload}`;

      // Compute expected signature
      const expectedSignature = this.computeSignature(signedPayload, secret, algorithm);

      // Compare signatures using timing-safe comparison
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (receivedBuffer.length !== expectedBuffer.length) {
        return { valid: false, error: 'Signature length mismatch' };
      }

      const isValid = timingSafeEqual(receivedBuffer, expectedBuffer);

      return {
        valid: isValid,
        error: isValid ? undefined : 'Signature verification failed'
      };

    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate timestamp to prevent replay attacks
   */
  private validateTimestamp(
    timestamp: string,
    toleranceInSeconds: number
  ): { valid: boolean; error?: string } {
    try {
      const webhookTime = parseInt(timestamp);

      if (isNaN(webhookTime)) {
        return { valid: false, error: 'Invalid timestamp format' };
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeDifference = Math.abs(currentTime - webhookTime);

      if (timeDifference > toleranceInSeconds) {
        return {
          valid: false,
          error: `Timestamp too old. Difference: ${timeDifference}s, tolerance: ${toleranceInSeconds}s`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Timestamp validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Compute HMAC signature
   */
  private computeSignature(payload: string, secret: string, algorithm: string): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Generate signature for outgoing webhooks (for testing)
   */
  generateSignature(
    payload: string | Buffer,
    secret: string,
    algorithm = 'sha256'
  ): { signature: string; timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payload}`;
    const signature = this.computeSignature(signedPayload, secret, algorithm);

    return {
      signature: `${algorithm}=${signature}`,
      timestamp
    };
  }
}

/**
 * Convenience function for validating webhook signatures
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  headers: WebhookHeaders,
  options?: WebhookValidationOptions & { toleranceInSeconds?: number }
): { valid: boolean; error?: string } {
  const validator = new WebhookSignatureValidator(options);
  return validator.validateSignature(payload, secret, headers, options);
}

/**
 * Express/Next.js middleware for webhook signature validation
 */
export function createWebhookValidationMiddleware(
  getSecret: (headers: WebhookHeaders) => Promise<string> | string,
  options?: WebhookValidationOptions
) {
  const validator = new WebhookSignatureValidator(options);

  return async (
    req: any,
    res: any,
    next: () => void
  ) => {
    try {
      const headers = req.headers as WebhookHeaders;
      const payload = req.body || req.rawBody || '';

      const secret = await getSecret(headers);
      if (!secret) {
        return res.status(401).json({ error: 'Unable to retrieve webhook secret' });
      }

      const validation = validator.validateSignature(payload, secret, headers);

      if (!validation.valid) {
        return res.status(401).json({
          error: 'Webhook signature validation failed',
          details: validation.error
        });
      }

      // Add validation info to request for downstream use
      req.webhookValidation = {
        valid: true,
        timestamp: headers['x-foresight-timestamp'],
        deliveryId: headers['x-foresight-delivery']
      };

      next();
    } catch (error) {
      console.error('Webhook validation middleware error:', error);
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

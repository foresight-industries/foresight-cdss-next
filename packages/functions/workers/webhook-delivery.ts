import { db } from '@foresight-cdss-next/db';
import { sql } from 'drizzle-orm';
import * as https from 'node:https';
import * as http from 'node:http';

interface WebhookResponse {
    statusCode: number;
    data: string;
}

interface WebhookData {
    url: string;
    payload: any;
    headers?: Record<string, string>;
    retryCount?: number;
}

interface LogData {
    url: string;
    status: string;
    responseCode?: number;
    error?: string;
    attempt: number;
    deliveredAt?: string;
    failedAt?: string;
}

export const handler = async (event: any) => {
    console.log('Webhook delivery started: records=%d', event.Records?.length || 0);
    console.log('Full event received:', JSON.stringify(event, null, 2));

    // Check if Records exists and is an array
    if (!event.Records) {
        console.error('No Records field found in event');
        return { batchItemFailures: [] };
    }

    if (!Array.isArray(event.Records)) {
        console.error('Records is not an array:', typeof event.Records, event.Records);
        return { batchItemFailures: [] };
    }

    if (event.Records.length === 0) {
        console.warn('Received empty Records array - no messages to process');
        return { batchItemFailures: [] };
    }

    const results = [];
    const batchItemFailures = [];

    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log('Delivering webhook: url=%s event=%s', message.webhookUrl, message.eventType);

            const result = await deliverWebhook(message);
            results.push(result);

        } catch (error) {
            console.error('Error delivering webhook:', error);
            batchItemFailures.push({
                itemIdentifier: record.messageId
            });
        }
    }

    return {
        batchItemFailures
    };
};

async function deliverWebhook(webhookData: WebhookData) {
    const { url, payload, headers = {}, retryCount = 0 } = webhookData;

    try {
        // Simulate webhook delivery
        const response = await sendWebhook(url, payload, headers);

        // Log successful delivery
        await logWebhookDelivery({
            url,
            status: 'success',
            responseCode: response.statusCode,
            attempt: retryCount + 1,
            deliveredAt: new Date().toISOString()
        });

        return {
            url,
            status: 'delivered',
            statusCode: response.statusCode,
            deliveredAt: new Date().toISOString()
        };

    } catch (error: any) {
        // Log failed delivery
        await logWebhookDelivery({
            url,
            status: 'failed',
            error: error.message,
            attempt: retryCount + 1,
            failedAt: new Date().toISOString()
        });

        throw error;
    }
}

function sendWebhook(url: string, payload: any, headers: Record<string, string>): Promise<WebhookResponse> {
    return new Promise<WebhookResponse>((resolve, reject) => {
        const data = JSON.stringify(payload);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'User-Agent': 'RCM-Webhook-Delivery/1.0',
                ...headers
            },
            timeout: 10000
        };

        const client = urlObj.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(data);
        req.end();
    });
}

async function logWebhookDelivery(logData: LogData) {
    try {
        console.log('Logging webhook delivery: url=%s status=%s attempt=%d', logData.url, logData.status, logData.attempt);

        await db.execute(sql`
            INSERT INTO webhook_delivery (webhook_config_id, event_type, event_data, http_status, status, attempt_count, delivered_at, created_at)
            VALUES (${sql.placeholder('00000000-0000-0000-0000-000000000000')}, ${'webhook_delivery'}, ${JSON.stringify({ url: logData.url, error: logData.error })}, ${logData.responseCode || 0}, ${logData.status}, ${logData.attempt}, ${logData.deliveredAt ? sql`${logData.deliveredAt}::timestamp` : sql`NOW()`}, NOW())
        `);

    } catch (error) {
        console.error('Failed to log webhook delivery:', error);
        // Don't throw - logging failure shouldn't fail the webhook
    }
}

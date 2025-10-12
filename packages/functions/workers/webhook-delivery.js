const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');

const rdsDataClient = new AWS.RDSDataService();

exports.handler = async (event) => {
    console.log('Webhook delivery event:', JSON.stringify(event, null, 2));
    
    const results = [];
    const batchItemFailures = [];
    
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log('Delivering webhook:', message);
            
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

async function deliverWebhook(webhookData) {
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
        
    } catch (error) {
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

function sendWebhook(url, payload, headers) {
    return new Promise((resolve, reject) => {
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
                if (res.statusCode >= 200 && res.statusCode < 300) {
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

async function logWebhookDelivery(logData) {
    try {
        const params = {
            resourceArn: process.env.DATABASE_CLUSTER_ARN,
            secretArn: process.env.DATABASE_SECRET_ARN,
            database: process.env.DATABASE_NAME,
            sql: `
                INSERT INTO webhook_logs (url, status, response_code, error_message, attempt, created_at)
                VALUES (:url, :status, :responseCode, :errorMessage, :attempt, NOW())
            `,
            parameters: [
                { name: 'url', value: { stringValue: logData.url } },
                { name: 'status', value: { stringValue: logData.status } },
                { name: 'responseCode', value: { longValue: logData.responseCode || 0 } },
                { name: 'errorMessage', value: { stringValue: logData.error || '' } },
                { name: 'attempt', value: { longValue: logData.attempt } }
            ]
        };
        
        console.log('Logging webhook delivery:', JSON.stringify(params, null, 2));
        // await rdsDataClient.executeStatement(params).promise();
        
    } catch (error) {
        console.error('Failed to log webhook delivery:', error);
        // Don't throw - logging failure shouldn't fail the webhook
    }
}
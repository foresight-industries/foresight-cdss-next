# Webhook System Documentation

## Overview

The Foresight CDSS webhook system allows teams to receive real-time notifications when their data changes. Each team can configure multiple webhook endpoints with different event filters, and the system supports both development and production environments.

## Architecture

### Components

1. **Database Tables**
   - `webhook_config` - Webhook configurations per team
   - `webhook_queue` - Async processing queue  
   - `webhook_delivery` - Delivery attempt logs

2. **API Endpoints**
   - `POST /api/webhooks/config` - Create webhook
   - `GET /api/webhooks/config` - List webhooks
   - `PUT /api/webhooks/config/[id]` - Update webhook
   - `DELETE /api/webhooks/config/[id]` - Delete webhook
   - `POST /api/webhooks/test` - Send test webhook
   - `POST /api/webhooks/process` - Process webhook queue

3. **Database Triggers**
   - Automatically queue webhooks when team data changes
   - Support for both development and production environments

4. **Management UI**
   - Located at `/settings/webhooks`
   - Environment switching (dev/prod)
   - Webhook testing and monitoring

## Setup

### 1. Run Database Migration

```bash
# Apply the webhook system migration
npx supabase db push
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Required: Webhook processor authentication
WEBHOOK_PROCESSOR_TOKEN=your_secure_random_token_here

# Optional: Environment setting
NODE_ENV=production  # or development

# Optional: Processor settings
WEBHOOK_PROCESSOR_BATCH_SIZE=50
WEBHOOK_PROCESSOR_RETRY_DELAY_MS=5000
```

Generate a secure token:
```bash
openssl rand -hex 32
```

### 3. Webhook Processing

Set up a cron job or scheduled task to process the webhook queue:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST -H "Authorization: Bearer YOUR_TOKEN" https://your-app.com/api/webhooks/process
```

Or use the programmatic approach:

```typescript
import { webhookProcessor } from '@/lib/webhook-processor';

// Process pending webhooks
await webhookProcessor.processPendingWebhooks();
```

## Usage

### Creating a Webhook

1. Navigate to **Settings > Webhooks**
2. Click **Add Webhook**
3. Fill in the form:
   - **Name**: Unique identifier for your webhook
   - **URL**: Your endpoint that will receive webhook events
   - **Events**: Select which events to listen for
   - **Environment**: Choose development or production
   - **Retry Count**: Number of retry attempts (1-10)
   - **Timeout**: Request timeout in seconds (5-300)

### Webhook Events

Available events:

- `team.created` - When a new team is created
- `team.updated` - When team information is modified  
- `team.deleted` - When a team is deleted
- `team_member.added` - When a team member is added
- `team_member.updated` - When team member info changes
- `team_member.removed` - When a team member is removed
- `all` - Listen to all events

### Webhook Payload

Example webhook payload:

```json
{
  "event_type": "team.updated",
  "team_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": 1638360000,
  "source": "foresight_cdss",
  "before": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Old Team Name",
    "slug": "old-team-slug"
  },
  "after": {
    "id": "123e4567-e89b-12d3-a456-426614174000", 
    "name": "New Team Name",
    "slug": "new-team-slug"
  },
  "changes": {
    "name": "New Team Name",
    "slug": "new-team-slug"
  }
}
```

### Webhook Headers

Each webhook request includes these headers:

```
Content-Type: application/json
User-Agent: Foresight-CDSS-Webhook/1.0
X-Foresight-Event: team.updated
X-Foresight-Signature: sha256=<hmac-signature>
X-Foresight-Team-ID: <team-uuid>
X-Foresight-Delivery: <delivery-uuid>
```

### Signature Verification

Verify webhook authenticity using HMAC:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return signature === expectedSignature;
}

// Usage in your webhook endpoint
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('X-Foresight-Signature');
  const secret = 'your-webhook-secret';
  
  if (!verifyWebhookSignature(body, signature, secret)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const payload = JSON.parse(body);
  // Process webhook...
}
```

## Development vs Production

The webhook system supports separate configurations for development and production environments:

### Environment Detection

- Automatically detects environment from `NODE_ENV`
- Can be overridden per webhook configuration
- Database triggers respect the current environment setting

### Team Slug Usage

Each team has a unique slug that can be used for:

- Creating team-specific webhook URLs
- Routing webhooks to different endpoints per team
- Custom webhook configurations based on team

Example team-specific endpoint:
```
https://your-app.com/api/webhooks/teams/{team-slug}
```

## Monitoring

### Webhook Management UI

The webhook management interface provides:

- **Real-time Status**: Active/inactive webhooks
- **Delivery Statistics**: Success rates and failure counts
- **Recent Deliveries**: Last 20 delivery attempts
- **Error Monitoring**: Latest error messages
- **Testing**: Send test webhooks to verify endpoints

### Webhook Delivery Logs

All delivery attempts are logged in the `webhook_delivery` table with:

- Response status codes
- Response bodies (truncated)
- Response times
- Error messages
- Retry attempt numbers

### Queue Monitoring

Monitor the webhook queue with:

```typescript
import { webhookProcessor } from '@/lib/webhook-processor';

const stats = await webhookProcessor.getQueueStats();
console.log(stats); // { pending: 5, processing: 2, failed: 1, total: 8 }
```

## Maintenance

### Retry Failed Webhooks

```typescript
const retriedCount = await webhookProcessor.retryFailedWebhooks();
console.log(`Retried ${retriedCount} failed webhooks`);
```

### Cleanup Old Delivery Logs

```typescript
// Remove delivery logs older than 30 days
const cleanedCount = await webhookProcessor.cleanupOldDeliveries(30);
console.log(`Cleaned up ${cleanedCount} old delivery logs`);
```

### Manual Webhook Trigger

```typescript
await webhookProcessor.triggerWebhook(
  'team-uuid',
  'team.updated', 
  { custom: 'payload' },
  'production'
);
```

## Security

### Best Practices

1. **Always verify webhook signatures** using HMAC
2. **Use HTTPS endpoints** for webhook URLs
3. **Implement idempotency** in your webhook handlers
4. **Set reasonable timeouts** (5-30 seconds)
5. **Monitor webhook delivery failures**
6. **Rotate webhook secrets** periodically

### Rate Limiting

The system includes built-in protections:

- **Retry limits**: Configurable per webhook (1-10 attempts)
- **Timeout limits**: 5-300 seconds per request
- **Batch processing**: Maximum 50 webhooks processed per batch
- **Queue limits**: Failed webhooks are marked as failed after max attempts

## Troubleshooting

### Common Issues

1. **Webhooks not triggering**
   - Check webhook is active
   - Verify correct environment (dev/prod)
   - Check event type configuration

2. **Delivery failures**
   - Verify endpoint URL is accessible
   - Check webhook signature verification
   - Review timeout settings

3. **High failure rates**
   - Monitor endpoint response times
   - Check for 5xx server errors
   - Verify webhook handler logic

### Debug Mode

Enable detailed logging:

```typescript
// In your webhook processor
console.log('Processing webhook:', {
  webhook_id: item.id,
  event_type: item.event_type,
  url: webhook_config.url,
  attempt: item.attempts + 1
});
```

## API Reference

### Create Webhook

```http
POST /api/webhooks/config
Content-Type: application/json

{
  "name": "team-sync-webhook",
  "url": "https://your-app.com/api/webhooks/foresight",
  "events": ["team.updated", "team_member.added"],
  "environment": "production",
  "retry_count": 3,
  "timeout_seconds": 30
}
```

### Test Webhook

```http
POST /api/webhooks/test
Content-Type: application/json

{
  "webhook_id": "webhook-uuid"
}
```

### Process Webhook Queue

```http
POST /api/webhooks/process
Authorization: Bearer YOUR_WEBHOOK_PROCESSOR_TOKEN
```

## Examples

### Basic Webhook Handler

```typescript
// /api/webhooks/foresight/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Foresight-Signature');
    const secret = process.env.WEBHOOK_SECRET;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
      
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const webhook = JSON.parse(body);
    
    // Handle different event types
    switch (webhook.event_type) {
      case 'team.updated':
        await handleTeamUpdate(webhook);
        break;
      case 'team_member.added':
        await handleMemberAdded(webhook);
        break;
      default:
        console.log('Unhandled event type:', webhook.event_type);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleTeamUpdate(webhook: any) {
  console.log('Team updated:', webhook.after.name);
  // Sync team data to your system
}

async function handleMemberAdded(webhook: any) {
  console.log('Member added:', webhook.after.user_id);
  // Notify team about new member
}
```

### Team-Specific Webhook Handler

```typescript
// /api/webhooks/teams/[slug]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const teamSlug = params.slug;
  const webhook = await request.json();
  
  // Verify this webhook is for the correct team
  if (webhook.team_slug !== teamSlug) {
    return NextResponse.json({ error: 'Team mismatch' }, { status: 400 });
  }
  
  // Handle team-specific logic
  await processTeamWebhook(teamSlug, webhook);
  
  return NextResponse.json({ success: true });
}
```

This webhook system provides a robust, scalable solution for real-time team data synchronization with comprehensive monitoring, security, and environment support.
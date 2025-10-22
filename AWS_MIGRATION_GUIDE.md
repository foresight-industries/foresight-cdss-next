# AWS Migration Guide

This guide will help you migrate from Supabase to AWS services using your existing infrastructure.

## Overview

Your AWS infrastructure is already set up and includes:
- ✅ **Aurora PostgreSQL Serverless v2** with Data API
- ✅ **AWS Lambda functions** for serverless backend
- ✅ **API Gateway** for REST and WebSocket APIs
- ✅ **S3 buckets** for file storage
- ✅ **Secrets Manager** for database credentials
- ✅ **VPC** with proper networking
- ✅ **Drizzle ORM** with AWS Data API integration

## Migration Components Created

### 1. Database Client (`/src/lib/aws/database.ts`)
- **Replaces**: `createSupabaseServerClient()`, `createSupabaseAdminClient()`
- **Features**: 
  - AWS RDS Data API integration
  - Team/organization context
  - Clerk authentication integration
  - Type-safe queries with Drizzle ORM

### 2. Storage Client (`/src/lib/aws/storage.ts`)
- **Replaces**: `supabase.storage`
- **Features**:
  - S3 integration with presigned URLs
  - Team-scoped file organization
  - Backward-compatible API
  - Automatic file path generation

### 3. Real-time Client (`/src/lib/aws/realtime.ts`)
- **Replaces**: `supabase.channel()`
- **Features**:
  - WebSocket connections via API Gateway
  - Server-Sent Events (SSE) support
  - Automatic reconnection
  - Event-driven updates

### 4. Main AWS Client (`/src/lib/aws/index.ts`)
- **Provides**: Unified interface for all AWS services
- **Features**:
  - Supabase-compatible API
  - Environment validation
  - Migration helpers

## Migration Steps

### Step 1: Environment Setup

1. Copy the AWS environment template:
   ```bash
   cp .env.example.aws .env.local
   ```

2. Get your AWS resource ARNs from CDK outputs:
   ```bash
   cd infra
   cdk deploy --outputs-file ../aws-outputs.json
   ```

3. Update `.env.local` with your values:
   - `DATABASE_CLUSTER_ARN`: From CDK output `RCM-ClusterArn-dev`
   - `DATABASE_SECRET_ARN`: From CDK output `RCM-SecretArn-dev`
   - `DOCUMENTS_BUCKET_NAME`: Your S3 bucket name
   - `AWS_REGION`: Your deployment region

### Step 2: Database Migration

Your database schema is already compatible since you're using the same PostgreSQL database structure.

1. **Verify database connection**:
   ```typescript
   import { checkDatabaseHealth } from '@/lib/aws/database';
   const isHealthy = await checkDatabaseHealth();
   ```

2. **Update imports gradually**:
   ```typescript
   // Before (Supabase)
   import { createSupabaseServerClient } from '@/lib/supabase/server';
   
   // After (AWS)
   import { createDatabaseClient } from '@/lib/aws/database';
   ```

### Step 3: Update API Routes

1. **Replace Supabase imports**:
   ```typescript
   // Before
   import { createSupabaseServerClient } from '@/lib/supabase/server';
   
   // After  
   import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
   ```

2. **Update database queries**:
   ```typescript
   // Before (Supabase)
   const { data, error } = await supabase
     .from('claims')
     .select('*')
     .eq('team_id', teamId);
   
   // After (AWS + Drizzle)
   const { db, teamId } = await createAuthenticatedDatabaseClient();
   const data = await db
     .select()
     .from(claims)
     .where(eq(claims.organizationId, teamId));
   ```

### Step 4: Update Storage Operations

1. **Replace storage imports**:
   ```typescript
   // Before
   import { createSupabaseClient } from '@/lib/supabase/client';
   
   // After
   import { storage } from '@/lib/aws/storage';
   ```

2. **Update storage calls**:
   ```typescript
   // Before
   const { data } = await supabase.storage
     .from('documents')
     .upload(path, file);
   
   // After
   const { data } = await storage
     .from('documents')
     .upload(path, file);
   ```

### Step 5: Update Real-time Subscriptions

1. **Replace real-time imports**:
   ```typescript
   // Before
   import { createSupabaseClient } from '@/lib/supabase/client';
   
   // After
   import { createRealtimeClient } from '@/lib/aws/realtime';
   ```

2. **Update subscriptions**:
   ```typescript
   // Before
   const subscription = supabase
     .channel('claims')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, handleChange)
     .subscribe();
   
   // After
   const realtime = createRealtimeClient();
   const subscription = realtime
     .channel('claims')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, handleChange)
     .subscribe();
   ```

### Step 6: Update Team Routing (✅ Already Done)

The team routing has been updated to use AWS database client with proper organization schema mapping.

## File-by-File Migration Checklist

### High Priority (Core Functionality)
- [ ] `src/proxy.ts` - Update to use AWS database
- [ ] `src/lib/supabase/server.ts` - Replace with AWS client
- [ ] `src/app/api/**/*.ts` - Update all API routes
- [ ] `src/hooks/**/*.ts` - Update React hooks
- [ ] `src/stores/**/*.ts` - Update Zustand stores

### Medium Priority (Features)
- [ ] `src/components/auth/**/*.tsx` - Auth components
- [ ] `src/components/settings/**/*.tsx` - Settings components
- [ ] `src/app/team/[slug]/**/*.tsx` - Team pages

### Low Priority (Cleanup)
- [ ] Remove Supabase dependencies from `package.json`
- [ ] Delete `src/lib/supabase/` directory
- [ ] Update `src/types/database.types.d.ts` if needed

## Testing Strategy

### 1. Unit Tests
```typescript
import { createDatabaseClient } from '@/lib/aws/database';

test('database client connects successfully', async () => {
  const { db, isAuthenticated } = await createDatabaseClient();
  expect(db).toBeDefined();
});
```

### 2. Integration Tests
- Test API routes with AWS backend
- Test file upload/download with S3
- Test real-time subscriptions

### 3. End-to-End Tests
- Full user workflows
- Authentication flows
- Data persistence

## Environment Variables Required

See `.env.example.aws` for complete configuration.

**Critical Environment Variables:**
```bash
# AWS Core
AWS_REGION=us-east-1
DATABASE_CLUSTER_ARN=arn:aws:rds:...
DATABASE_SECRET_ARN=arn:aws:secretsmanager:...
DATABASE_NAME=rcm
DOCUMENTS_BUCKET_NAME=your-bucket-name

# Clerk (unchanged)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

## Rollback Strategy

If issues arise, you can quickly rollback by:

1. **Revert environment variables**:
   ```bash
   # In .env.local, set:
   ENABLE_AWS_MIGRATION=false
   DATABASE_MODE=supabase
   ```

2. **Keep Supabase dependencies** until migration is complete

3. **Use feature flags** for gradual rollout:
   ```typescript
   const useAWS = process.env.ENABLE_AWS_MIGRATION === 'true';
   const client = useAWS ? createAWSClient() : createSupabaseClient();
   ```

## Performance Benefits

After migration, you'll benefit from:
- **Lower costs**: No Supabase subscription fees
- **Better performance**: AWS Aurora Serverless v2 auto-scaling
- **Improved security**: VPC isolation and AWS IAM
- **Greater control**: Full infrastructure ownership
- **Better integration**: Native AWS service integration

## Monitoring & Observability

Your AWS setup includes:
- **CloudWatch Logs**: Database and Lambda logging
- **CloudWatch Metrics**: Performance monitoring
- **AWS X-Ray**: Distributed tracing (enabled on Lambdas)
- **Database slow query logs**: Queries > 1 second logged

## Support

- **Database Issues**: Check CloudWatch logs for Aurora cluster
- **API Issues**: Check Lambda function logs in CloudWatch
- **Storage Issues**: Check S3 access permissions
- **Real-time Issues**: Check API Gateway WebSocket logs

## Next Steps

1. **Start with API routes** - They have the most isolated impact
2. **Test thoroughly** in development environment
3. **Migrate feature by feature** rather than all at once
4. **Monitor performance** during and after migration
5. **Update documentation** as you migrate components

The AWS infrastructure is production-ready and includes all necessary security, monitoring, and scalability features.

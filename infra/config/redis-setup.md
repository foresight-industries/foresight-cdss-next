# Redis.io Setup Guide for Medical Code Caching

## 1. Create Redis.io Account and Database

### Step 1: Sign up for Redis.io
1. Go to https://redis.io/cloud/
2. Create account or sign in
3. Choose "Redis Cloud" (recommended for production)

### Step 2: Create Redis Database
1. Click "New Database"
2. Choose configuration:
   - **Plan**: Essential (for dev/staging) or Professional (for prod)
   - **Memory**: 
     - Dev: 30MB (free)
     - Staging: 100MB ($7/month)
     - Prod: 500MB+ ($15+/month)
   - **Region**: Choose closest to your AWS region
   - **Modules**: Enable RediSearch and RedisJSON for enhanced features

3. Configure Redis parameters for medical code optimization:
   - **maxmemory-policy**: `allkeys-lru` (evict least recently used keys)
   - **timeout**: `300` (5 minute client timeout)
   - **tcp-keepalive**: `60` (1 minute keepalive for stable connections)

### Step 3: Get Connection Details
After database creation, you'll get:
- **Endpoint**: `redis-xxxxx.xxxxx.redislabs.com:xxxxx`
- **Password**: Generated password
- **Connection String**: `redis://default:password@endpoint:port`

## 2. Configure CDK Deployment

### Step 1: Set Environment Variables
Create/update `.env` files:

```bash
# .env.dev
REDIS_CONNECTION_STRING=redis://default:your-dev-password@your-dev-endpoint:port

# .env.staging  
REDIS_CONNECTION_STRING=redis://default:your-staging-password@your-staging-endpoint:port

# .env.prod
REDIS_CONNECTION_STRING=redis://default:your-prod-password@your-prod-endpoint:port
```

### Step 2: Deploy Infrastructure
```bash
# Deploy dev environment
npm run cdk:deploy:dev

# Deploy staging environment  
npm run cdk:deploy:staging

# Deploy production environment
npm run cdk:deploy:prod
```

## 3. Update CDK Context

Add to `cdk.json`:
```json
{
  "context": {
    "dev": {
      "redisConnectionString": "redis://default:dev-password@dev-endpoint:port"
    },
    "staging": {
      "redisConnectionString": "redis://default:staging-password@staging-endpoint:port"  
    },
    "prod": {
      "redisConnectionString": "redis://default:prod-password@prod-endpoint:port"
    }
  }
}
```

## 4. Medical Code Cache Configuration

### Redis.io Optimal Settings
Configure these parameters in your Redis.io console under "Configuration":

```redis
# Memory Management
maxmemory-policy allkeys-lru

# Connection Stability  
timeout 300
tcp-keepalive 60

# Performance
tcp-nodelay yes
maxclients 10000
```

The infrastructure automatically creates the following cache keys structure:

### Cache Key Patterns
- **CPT Codes**: `cpt:{code}` (e.g., `cpt:99213`)
- **ICD-10 Codes**: `icd10:{code}` (e.g., `icd10:Z00.00`)  
- **Hot Codes**: `hot:codes:{teamId}`
- **Category Codes**: `{type}:category:{category}`
- **Crosswalk**: `crosswalk:{icd10Id}:{cptId?}`

### TTL Settings
- **Default Cache**: 1 hour (3600 seconds)
- **Hot Codes**: 2 hours (7200 seconds)
- **Crosswalk Data**: 1 hour (3600 seconds)

### Memory Usage Estimates
- **50,000 CPT codes**: ~5MB
- **100,000 ICD-10 codes**: ~15MB  
- **Hot codes (1000 per org)**: ~100KB per organization
- **Crosswalk data**: ~2MB per 10,000 relationships

## 5. Monitoring and Alerts

### Redis.io Dashboard
- Monitor memory usage, hits/misses, connections
- Set up alerts for high memory usage (>80%)
- Track connection count and response times

### CloudWatch Integration
The medical code services automatically log:
- Cache hit/miss rates
- Query performance metrics
- Error rates and types
- Memory usage patterns

### Recommended Alerts
1. **High Memory Usage**: >80% of allocated memory
2. **Low Hit Rate**: <80% cache hit rate
3. **Connection Errors**: Any Redis connection failures
4. **Slow Queries**: Queries taking >100ms
5. **Backup Failures**: Failed S3 backup uploads
6. **Backup Age**: Backups older than expected frequency

## 6. Security Configuration

### VPC Peering (Production Only)
For enhanced security in production:
1. Enable VPC peering in Redis.io console
2. Configure AWS VPC peering connection
3. Update security groups to allow Redis traffic

### Access Control
- Use strong passwords (auto-generated recommended)
- Enable SSL/TLS encryption
- Rotate passwords quarterly in production
- Use IAM roles for secret access in AWS

## 7. Backup and Disaster Recovery

### Redis.io S3 Backup Configuration
**Development Environment**:
- Backup Destination: `s3://foresight-dev-medical-codes/backups/redis/dev/`
- Frequency: Manual snapshots only
- Retention: 7 days

**Staging Environment**:
- Backup Destination: `s3://foresight-staging-medical-codes/backups/redis/daily/`
- Frequency: Daily at 3 AM UTC
- Retention: 7 days

**Production Environment**:
- Backup Destination: `s3://foresight-prod-medical-codes/backups/redis/hourly/`
- Frequency: Every 4 hours
- Retention: 30 days

### Backup Configuration Steps
1. In Redis.io console, go to "Data Persistence" → "Backup"
2. Enable "Remote Backup" to S3
3. Configure S3 settings:
   - **Access Key**: Use IAM user with limited S3 permissions
   - **Secret Key**: Corresponding secret access key
   - **Bucket**: Environment-specific bucket name
   - **Path**: Environment-specific backup path
4. Set backup frequency based on environment
5. Configure retention policy

### S3 Backup Lifecycle
- **7 days**: Standard storage
- **30 days**: Transition to Infrequent Access
- **90 days**: Archive to Glacier
- **1 year (prod)** / **90 days (staging/dev)**: Automatic deletion

### Cross-Region Replication
For production, consider:
- Active-passive replication to another region
- Automatic failover configuration
- Data synchronization monitoring

## 8. Cost Optimization

### Right-sizing
- Monitor actual memory usage vs allocated
- Scale down during low usage periods
- Use reserved instances for predictable workloads

### Cache Efficiency
- Monitor hit rates and optimize TTL values
- Implement cache warming for frequently accessed data
- Use compression for large datasets

## 9. Troubleshooting

### Common Issues
1. **Connection Timeouts**: Check network connectivity and security groups
2. **Memory Limits**: Monitor usage and clear unused keys
3. **Authentication Errors**: Verify connection string and credentials
4. **Performance Issues**: Check Redis.io metrics and optimize queries

### Debug Commands
```bash
# Test Redis connection
redis-cli -h your-endpoint -p your-port -a your-password ping

# Monitor Redis performance
redis-cli -h your-endpoint -p your-port -a your-password monitor

# Check memory usage
redis-cli -h your-endpoint -p your-port -a your-password info memory
```

## 10. Migration Path

### From Development to Production
1. Export data from dev Redis using `DUMP` commands
2. Import to production Redis using `RESTORE` commands  
3. Update DNS/connection strings in production deployment
4. Verify data integrity and performance

### Scaling Strategy
1. Start with Essential plan for development
2. Upgrade to Professional for staging/production
3. Monitor growth and scale memory as needed
4. Consider sharding for very large datasets (>10GB)
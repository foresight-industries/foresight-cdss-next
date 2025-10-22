import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface ElastiCacheStackProps extends cdk.StackProps {
  stageName: string;
  vpc: ec2.IVpc;
  alertTopicArn?: string;
}

export class ElastiCacheStack extends cdk.Stack {
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly redisSubnetGroup: elasticache.CfnSubnetGroup;

  constructor(scope: Construct, id: string, props: ElastiCacheStackProps) {
    super(scope, id, props);

    // Create subnet group for ElastiCache
    this.redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: `Redis subnet group for ${props.stageName}`,
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `foresight-redis-subnet-group-${props.stageName}`,
    });

    // Create security group for Redis cluster
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Foresight Redis cluster',
      allowAllOutbound: false,
    });

    // Allow Redis access from within VPC (Lambda functions, Batch jobs, AppSync resolvers)
    this.redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC resources'
    );

    // Create parameter group for Redis configuration
    const redisParameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParameterGroup', {
      cacheParameterGroupFamily: 'redis7',
      description: `Redis parameter group for ${props.stageName}`,
      properties: {
        // Optimize for session and API caching
        'maxmemory-policy': 'allkeys-lru', // Evict least recently used keys when memory is full
        'timeout': '300', // Client idle timeout (5 minutes)
        'tcp-keepalive': '60', // TCP keepalive
        // Enable notifications for key events (useful for cache invalidation)
        'notify-keyspace-events': 'Ex', // Expired keys events
      },
    });

    // Create Redis replication group (cluster)
    this.redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupId: `foresight-redis-${props.stageName}`,
      replicationGroupDescription: `Foresight Redis cluster for ${props.stageName}`,

      // Node configuration - Right-sized for workload
      cacheNodeType: props.stageName === 'prod' ? 'cache.t3.small' : 'cache.t3.micro',
      numCacheClusters: props.stageName === 'prod' ? 2 : 1, // Multi-AZ for prod
      multiAzEnabled: props.stageName === 'prod',

      // Network configuration
      cacheSubnetGroupName: this.redisSubnetGroup.ref,
      securityGroupIds: [this.redisSecurityGroup.securityGroupId],

      // Redis configuration
      engine: 'redis',
      engineVersion: '7.0',
      cacheParameterGroupName: redisParameterGroup.ref,
      port: 6379,

      // Security configuration
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      authToken: cdk.Fn.ref('AWS::NoValue'), // No auth token for simplicity, rely on security groups

      // Backup configuration
      automaticFailoverEnabled: props.stageName === 'prod',
      snapshotRetentionLimit: props.stageName === 'prod' ? 7 : 1,
      snapshotWindow: '03:00-04:00', // UTC
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00', // UTC

      // Logging
      logDeliveryConfigurations: [
        {
          destinationType: 'cloudwatch-logs',
          destinationDetails: {
            cloudWatchLogsDetails: {
              logGroup: `/aws/elasticache/redis/foresight-${props.stageName}`,
            }
          },
          logFormat: 'json',
          logType: 'slow-log',
        },
      ],

      // Tags
      tags: [
        {
          key: 'Name',
          value: `foresight-redis-${props.stageName}`,
        },
        {
          key: 'Environment',
          value: props.stageName,
        },
        {
          key: 'Project',
          value: 'ForesightRCM',
        },
        {
          key: 'Purpose',
          value: 'API-Caching-Sessions',
        },
      ],
    });

    // Create CloudWatch Log Group for Redis logs
    new logs.LogGroup(this, 'RedisLogGroup', {
      logGroupName: `/aws/elasticache/redis/foresight-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
    });

    // Create CloudWatch alarms for Redis monitoring
    if (props.alertTopicArn) {
      const alertTopic = sns.Topic.fromTopicArn(this, 'AlertTopic', props.alertTopicArn);

      // CPU utilization alarm
      new cloudwatch.Alarm(this, 'RedisCpuAlarm', {
        alarmName: `Foresight-Redis-HighCPU-${props.stageName}`,
        alarmDescription: 'Redis CPU utilization is high',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ElastiCache',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            CacheClusterId: this.redisCluster.replicationGroupId!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Memory utilization alarm
      new cloudwatch.Alarm(this, 'RedisMemoryAlarm', {
        alarmName: `Foresight-Redis-HighMemory-${props.stageName}`,
        alarmDescription: 'Redis memory utilization is high',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ElastiCache',
          metricName: 'DatabaseMemoryUsagePercentage',
          dimensionsMap: {
            CacheClusterId: this.redisCluster.replicationGroupId!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 85,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Connection count alarm
      new cloudwatch.Alarm(this, 'RedisConnectionsAlarm', {
        alarmName: `Foresight-Redis-HighConnections-${props.stageName}`,
        alarmDescription: 'Redis connection count is high',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ElastiCache',
          metricName: 'CurrConnections',
          dimensionsMap: {
            CacheClusterId: this.redisCluster.replicationGroupId!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 500,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Cache hit ratio alarm (low hit ratio indicates poor caching strategy)
      new cloudwatch.Alarm(this, 'RedisCacheHitRatioAlarm', {
        alarmName: `Foresight-Redis-LowCacheHitRatio-${props.stageName}`,
        alarmDescription: 'Redis cache hit ratio is low',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ElastiCache',
          metricName: 'CacheHitRate',
          dimensionsMap: {
            CacheClusterId: this.redisCluster.replicationGroupId!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(15),
        }),
        threshold: 70, // Alert if hit ratio drops below 70%
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        evaluationPeriods: 3,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    }

    // Outputs
    new cdk.CfnOutput(this, 'RedisClusterEndpoint', {
      value: this.redisCluster.attrPrimaryEndPointAddress,
      description: 'Redis cluster endpoint for cache access',
      exportName: `Foresight-Redis-Endpoint-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'RedisClusterPort', {
      value: this.redisCluster.attrPrimaryEndPointPort,
      description: 'Redis cluster port',
      exportName: `Foresight-Redis-Port-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'RedisSecurityGroupId', {
      value: this.redisSecurityGroup.securityGroupId,
      description: 'Security group ID for Redis access',
      exportName: `Foresight-Redis-SecurityGroup-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'RedisClusterId', {
      value: this.redisCluster.replicationGroupId!,
      description: 'Redis cluster ID',
      exportName: `Foresight-Redis-ClusterId-${props.stageName}`,
    });
  }

  /**
   * Helper method to get cache configuration for different use cases
   */
  public static getCacheKeys() {
    return {
      // User sessions (OIDC tokens, user preferences)
      sessions: {
        prefix: 'session:',
        ttl: 3600, // 1 hour
        description: 'User session data and OIDC tokens',
      },

      // API response caching
      api: {
        prefix: 'api:',
        ttl: 300, // 5 minutes
        description: 'Cached API responses for frequent queries',
      },

      // Patient data caching
      patients: {
        prefix: 'patient:',
        ttl: 1800, // 30 minutes
        description: 'Frequently accessed patient information',
      },

      // Claim data caching
      claims: {
        prefix: 'claim:',
        ttl: 900, // 15 minutes
        description: 'Claim status and processing data',
      },

      // Rate limiting
      rateLimit: {
        prefix: 'rate:',
        ttl: 60, // 1 minute
        description: 'API rate limiting counters',
      },

      // Real-time metrics
      metrics: {
        prefix: 'metrics:',
        ttl: 120, // 2 minutes
        description: 'Cached metrics for AppSync real-time updates',
      },

      // Distributed locks
      locks: {
        prefix: 'lock:',
        ttl: 300, // 5 minutes
        description: 'Distributed locks for claim processing',
      },

      // Query result caching
      queries: {
        prefix: 'query:',
        ttl: 600, // 10 minutes
        description: 'Expensive database query results',
      },
    };
  }
}

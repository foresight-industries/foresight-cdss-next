import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  stageName: string;
  database: rds.DatabaseCluster;
  api?: apigateway.HttpApi;
  queues?: {
    claimsQueue: sqs.Queue;
    webhookQueue: sqs.Queue;
    dlq: sqs.Queue;
  };
  stackType?: 'alerting' | 'monitoring';
}

export class MonitoringStack extends cdk.Stack {
  public readonly alarmTopic: sns.ITopic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts - reference existing topic from alerting stack
    if (props.stackType === 'alerting') {
      // Create topic only in alerting stack
      this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
        topicName: `rcm-alarms-${props.stageName}`,
        displayName: `RCM Alarms - ${props.stageName}`,
      });
    } else {
      // Reference existing topic in monitoring stack with different construct ID
      this.alarmTopic = sns.Topic.fromTopicArn(
        this,
        'ExistingAlarmTopic',
        `arn:aws:sns:${this.region}:${this.account}:rcm-alarms-${props.stageName}`
      );
    }

    // Only add subscriptions in the alerting stack
    if (props.stackType === 'alerting') {
      // Add email subscription
      this.alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(
          process.env.ALARM_EMAIL || 'ops@have-foresight.com'
        )
      );

      // Add Slack webhook if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        const slackFunction = new lambdaNodejs.NodejsFunction(this, 'SlackNotifier', {
          functionName: `rcm-slack-notifier-${props.stageName}`,
          entry: '../packages/functions/notifications/slack-notifier.ts',
          handler: 'handler',
          runtime: lambda.Runtime.NODEJS_22_X,
          timeout: cdk.Duration.seconds(30),
          memorySize: 256,
          environment: {
            NODE_ENV: props.stageName,
            SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
          },
          bundling: {
            minify: true,
            sourceMap: false,
            target: 'node22',
            externalModules: ['@aws-sdk/*'],
          },
        });

        this.alarmTopic.addSubscription(
          new snsSubscriptions.LambdaSubscription(slackFunction)
        );
      }
    }

    // Database Alarms
    const dbCPUAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ServerlessDatabaseCapacity',
        dimensionsMap: {
          DBClusterIdentifier: props.database.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.stageName === 'prod' ? 3 : 0.75, // ACUs
      evaluationPeriods: 2,
      alarmDescription: 'Database capacity is high',
    });
    dbCPUAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: props.database.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Database connections are high',
    });
    dbConnectionsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // API Gateway Alarms (only if API is provided)
    if (props.api) {
      const api4xxAlarm = new cloudwatch.Alarm(this, 'API4xxAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGatewayV2',
          metricName: '4XXError',
          dimensionsMap: {
            ApiId: props.api.httpApiId,
            Stage: '$default',
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 50,
        evaluationPeriods: 1,
        alarmDescription: 'High 4xx error rate',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      const api5xxAlarm = new cloudwatch.Alarm(this, 'API5xxAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGatewayV2',
          metricName: '5XXError',
          dimensionsMap: {
            ApiId: props.api.httpApiId,
            Stage: '$default',
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 1,
        alarmDescription: 'High 5xx error rate',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      const apiLatencyAlarm = new cloudwatch.Alarm(this, 'APILatencyAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGatewayV2',
          metricName: 'IntegrationLatency',
          dimensionsMap: {
            ApiId: props.api.httpApiId,
            Stage: '$default',
          },
          statistic: 'P99',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1000, // 1 second
        evaluationPeriods: 2,
        alarmDescription: 'API latency is high',
      });
      apiLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    }

    // SQS Queue Alarms (if queues are provided)
    if (props.queues) {
      const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
        metric: props.queues.dlq.metricApproximateNumberOfMessagesVisible(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Messages in dead letter queue',
      });
      dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      const queueAgeAlarm = new cloudwatch.Alarm(this, 'QueueAgeAlarm', {
        metric: props.queues.claimsQueue.metricApproximateAgeOfOldestMessage(),
        threshold: 3600, // 1 hour in seconds
        evaluationPeriods: 1,
        alarmDescription: 'Messages are aging in queue',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      queueAgeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    }

    // Only create dashboards for full monitoring stack, not alerting stack
    if (props.stackType !== 'alerting') {
      // Main Dashboard
      const dashboard = new cloudwatch.Dashboard(this, 'MainDashboard', {
        dashboardName: `rcm-dashboard-${props.stageName}`,
        defaultInterval: cdk.Duration.hours(3),
      });

    // API Metrics Row (only if API is provided)
    if (props.api) {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'API Requests',
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApiGatewayV2',
              metricName: 'Count',
              dimensionsMap: {
                ApiId: props.api.httpApiId,
                Stage: '$default'
              },
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
            }),
          ],
          right: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApiGatewayV2',
              metricName: '4XXError',
              dimensionsMap: {
                ApiId: props.api.httpApiId,
                Stage: '$default'
              },
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              color: cloudwatch.Color.ORANGE,
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApiGatewayV2',
              metricName: '5XXError',
              dimensionsMap: {
                ApiId: props.api.httpApiId,
                Stage: '$default'
              },
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
              color: cloudwatch.Color.RED,
            }),
          ],
          width: 12,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: 'API Latency',
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApiGatewayV2',
              metricName: 'IntegrationLatency',
              dimensionsMap: {
                ApiId: props.api.httpApiId,
                Stage: '$default'
              },
              statistic: 'P50',
              period: cdk.Duration.minutes(5),
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApiGatewayV2',
              metricName: 'IntegrationLatency',
              dimensionsMap: {
                ApiId: props.api.httpApiId,
                Stage: '$default'
              },
              statistic: 'P99',
              period: cdk.Duration.minutes(5),
            }),
          ],
          width: 12,
          height: 6,
        }),
      );
    }

    // Database Metrics Row
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ServerlessDatabaseCapacity',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // Enhanced Database Performance Dashboard
    const dbPerformanceDashboard = new cloudwatch.Dashboard(this, 'DatabasePerformanceDashboard', {
      dashboardName: `rcm-db-performance-${props.stageName}`,
    });

    // Query Performance Metrics
    dbPerformanceDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Query Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ReadLatency',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'WriteLatency',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ReadThroughput',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'WriteThroughput',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 24,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Connection Pool Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(1),
            label: 'Active Connections',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'LoginFailures',
            dimensionsMap: { DBClusterIdentifier: props.database.clusterIdentifier },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Slow Query Detection',
        left: [
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'SlowQueryCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.ORANGE,
          }),
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'AverageQueryDuration',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // Error and Lock Metrics
    dbPerformanceDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Errors and Locks',
        left: [
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'ErrorCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.RED,
          }),
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'LockWaitCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'DeadlockCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Authentication Events',
        left: [
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'SuccessfulLogins',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.GREEN,
          }),
          new cloudwatch.Metric({
            namespace: 'RCM/Database',
            metricName: 'FailedLogins',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // Database Alarms for new metrics
    const slowQueryAlarm = new cloudwatch.Alarm(this, 'SlowQueryAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'RCM/Database',
        metricName: 'SlowQueryCount',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'High number of slow queries detected',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    slowQueryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    const dbErrorAlarm = new cloudwatch.Alarm(this, 'DatabaseErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'RCM/Database',
        metricName: 'ErrorCount',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Database errors detected',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'RCM/Database',
        metricName: 'FailedLogins',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'High number of database authentication failures',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    authFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Queue Metrics Row (if queues are provided)
    if (props.queues) {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Queue Messages',
          left: [
            props.queues.claimsQueue.metricApproximateNumberOfMessagesVisible(),
            props.queues.webhookQueue.metricApproximateNumberOfMessagesVisible(),
          ],
          right: [
            props.queues.dlq.metricApproximateNumberOfMessagesVisible({
              color: cloudwatch.Color.RED,
            }),
          ],
          width: 12,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: 'Queue Age',
          left: [
            props.queues.claimsQueue.metricApproximateAgeOfOldestMessage(),
            props.queues.webhookQueue.metricApproximateAgeOfOldestMessage(),
          ],
          width: 12,
          height: 6,
        }),
      );
    }

    // Custom Metrics for Business KPIs
    const businessDashboard = new cloudwatch.Dashboard(this, 'BusinessDashboard', {
      dashboardName: `rcm-business-${props.stageName}`,
    });

    // You'll publish these metrics from your Lambda functions
    businessDashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Total Claims Today',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'RCM/Business',
            metricName: 'ClaimsCreated',
            statistic: 'Sum',
            period: cdk.Duration.days(1),
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Authorization Approval Rate',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'RCM/Business',
            metricName: 'AuthorizationApprovalRate',
            statistic: 'Average',
            period: cdk.Duration.days(1),
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Average Claim Processing Time',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'RCM/Business',
            metricName: 'ClaimProcessingTime',
            statistic: 'Average',
            period: cdk.Duration.days(1),
            unit: cloudwatch.Unit.SECONDS,
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Revenue This Month',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'RCM/Business',
            metricName: 'Revenue',
            statistic: 'Sum',
            period: cdk.Duration.days(30),
          }),
        ],
        width: 6,
        height: 4,
      }),
    );
    }
  }
}

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  stageName: string;
  database: rds.DatabaseCluster;
  api: apigateway.HttpApi;
  queues?: {
    claimsQueue: sqs.Queue;
    webhookQueue: sqs.Queue;
    dlq: sqs.Queue;
  };
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `rcm-alarms-${props.stageName}`,
      displayName: `RCM ${props.stageName} Alarms`,
    });

    // Add email subscription
    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(
        process.env.ALARM_EMAIL || 'ops@have-foresight.com'
      )
    );

    // Add Slack webhook if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackFunction = new lambda.Function(this, 'SlackNotifier', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const https = require('https');
          const util = require('util');

          exports.handler = async (event) => {
            const message = JSON.parse(event.Records[0].Sns.Message);
            const color = message.NewStateValue === 'ALARM' ? 'danger' : 'good';

            const payload = {
              attachments: [{
                color: color,
                title: message.AlarmName,
                text: message.AlarmDescription,
                fields: [
                  { title: 'State', value: message.NewStateValue, short: true },
                  { title: 'Reason', value: message.NewStateReason, short: false },
                  { title: 'Time', value: message.StateChangeTime, short: true },
                ],
              }],
            };

            return new Promise((resolve, reject) => {
              const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              };

              const req = https.request(process.env.SLACK_WEBHOOK_URL, options, (res) => {
                resolve({ statusCode: res.statusCode });
              });

              req.on('error', reject);
              req.write(JSON.stringify(payload));
              req.end();
            });
          };
        `),
        environment: {
          SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
        },
      });

      alarmTopic.addSubscription(
        new snsSubscriptions.LambdaSubscription(slackFunction)
      );
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
    dbCPUAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

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
    dbConnectionsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // API Gateway Alarms
    const api4xxAlarm = new cloudwatch.Alarm(this, 'API4xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.api.httpApiName || 'rcm-api',
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 1,
      alarmDescription: 'High 4xx error rate',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const api5xxAlarm = new cloudwatch.Alarm(this, 'API5xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.api.httpApiName || 'rcm-api',
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'High 5xx error rate',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'APILatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: props.api.httpApiName || 'rcm-api',
        },
        statistic: 'P99',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'API latency is high',
    });
    apiLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // SQS Queue Alarms (if queues are provided)
    if (props.queues) {
      const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
        metric: props.queues.dlq.metricApproximateNumberOfMessagesVisible(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Messages in dead letter queue',
      });
      dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      const queueAgeAlarm = new cloudwatch.Alarm(this, 'QueueAgeAlarm', {
        metric: props.queues.claimsQueue.metricApproximateAgeOfOldestMessage(),
        threshold: 3600, // 1 hour in seconds
        evaluationPeriods: 1,
        alarmDescription: 'Messages are aging in queue',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      queueAgeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    }

    // Main Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MainDashboard', {
      dashboardName: `rcm-dashboard-${props.stageName}`,
      defaultInterval: cdk.Duration.hours(3),
    });

    // API Metrics Row
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: props.api.httpApiName || 'rcm-api' },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: { ApiName: props.api.httpApiName || 'rcm-api' },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            color: cloudwatch.Color.ORANGE,
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { ApiName: props.api.httpApiName || 'rcm-api' },
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
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: { ApiName: props.api.httpApiName || 'rcm-api' },
            statistic: 'P50',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: { ApiName: props.api.httpApiName || 'rcm-api' },
            statistic: 'P99',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

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

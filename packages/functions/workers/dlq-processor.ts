import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const sns = new SNSClient({});
const cloudwatch = new CloudWatchClient({});

export const handler = async (event: SQSEvent) => {
  console.error('DLQ Messages:', JSON.stringify(event.Records, null, 2));

  try {
    // Send SNS alert if topic is configured
    if (process.env.ALERT_TOPIC_ARN) {
      const alertMessage = `Failed messages in DLQ: ${event.Records.length}

Records:
${event.Records.map((record: SQSRecord, index: number) => 
  `${index + 1}. Message ID: ${record.messageId}
     Body: ${record.body.substring(0, 200)}${record.body.length > 200 ? '...' : ''}
     Attributes: ${JSON.stringify(record.messageAttributes)}`
).join('\n\n')}`;

      await sns.send(new PublishCommand({
        TopicArn: process.env.ALERT_TOPIC_ARN,
        Subject: `RCM DLQ Alert - ${process.env.NODE_ENV || 'unknown'} Environment`,
        Message: alertMessage,
      }));
    }

    // Publish custom metric
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'RCM/DLQ',
      MetricData: [{
        MetricName: 'FailedMessages',
        Value: event.Records.length,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
      }],
    }));

    console.log(`Processed ${event.Records.length} DLQ messages`);
    return { batchItemFailures: [] };
  } catch (error) {
    console.error('Error processing DLQ messages:', error);
    // Don't fail the function - we don't want DLQ messages to loop back
    return { batchItemFailures: [] };
  }
};
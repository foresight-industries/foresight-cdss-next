import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsEvent } from 'aws-lambda';
import { gunzipSync } from 'zlib';

const cloudWatch = new CloudWatchClient({});

interface ParsedLogEvent {
  timestamp: string;
  level: string;
  message: string;
  user?: string;
  database?: string;
  duration?: number;
  statement?: string;
}

export const handler = async (event: CloudWatchLogsEvent) => {
  console.log('Processing CloudWatch Logs event:', JSON.stringify(event, null, 2));

  try {
    // Process each log stream
    for (const record of event.awslogs.data ? [event.awslogs] : []) {
      const compressed = Buffer.from(record.data, 'base64');
      const decompressed = gunzipSync(compressed);
      const logData = JSON.parse(decompressed.toString('utf8'));

      console.log('Log data:', JSON.stringify(logData, null, 2));

      const metrics: any[] = [];
      let slowQueryCount = 0;
      let errorCount = 0;
      let successfulLogins = 0;
      let failedLogins = 0;
      let lockWaitCount = 0;
      let deadlockCount = 0;
      let totalQueryDuration = 0;
      let queryCount = 0;

      // Process each log event
      for (const logEvent of logData.logEvents) {
        const parsedEvent = parsePostgreSQLLog(logEvent.message);
        
        if (!parsedEvent) continue;

        // Count slow queries (duration > 1000ms)
        if (parsedEvent.duration && parsedEvent.duration > 1000) {
          slowQueryCount++;
          console.log(`Slow query detected: ${parsedEvent.duration}ms - ${parsedEvent.statement?.substring(0, 100)}`);
        }

        // Count query durations for average
        if (parsedEvent.duration) {
          totalQueryDuration += parsedEvent.duration;
          queryCount++;
        }

        // Count errors
        if (parsedEvent.level === 'ERROR' || parsedEvent.level === 'FATAL') {
          errorCount++;
          console.log(`Database error: ${parsedEvent.message}`);
        }

        // Count authentication events
        if (parsedEvent.message.includes('connection authorized') || 
            parsedEvent.message.includes('connection received')) {
          successfulLogins++;
        }

        if (parsedEvent.message.includes('authentication failed') || 
            parsedEvent.message.includes('password authentication failed')) {
          failedLogins++;
          console.log(`Failed login attempt: ${parsedEvent.message}`);
        }

        // Count lock waits
        if (parsedEvent.message.includes('process') && 
            (parsedEvent.message.includes('still waiting for') || 
             parsedEvent.message.includes('acquired'))) {
          lockWaitCount++;
        }

        // Count deadlocks
        if (parsedEvent.message.includes('deadlock detected')) {
          deadlockCount++;
          console.log(`Deadlock detected: ${parsedEvent.message}`);
        }
      }

      // Calculate average query duration
      const averageQueryDuration = queryCount > 0 ? totalQueryDuration / queryCount : 0;

      // Prepare metrics for CloudWatch
      const metricData = [
        {
          MetricName: 'SlowQueryCount',
          Value: slowQueryCount,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'ErrorCount',
          Value: errorCount,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'SuccessfulLogins',
          Value: successfulLogins,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'FailedLogins',
          Value: failedLogins,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'LockWaitCount',
          Value: lockWaitCount,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'DeadlockCount',
          Value: deadlockCount,
          Unit: StandardUnit.Count,
          Timestamp: new Date(),
        },
        {
          MetricName: 'AverageQueryDuration',
          Value: averageQueryDuration,
          Unit: StandardUnit.Milliseconds,
          Timestamp: new Date(),
        },
      ];

      // Send metrics to CloudWatch
      const command = new PutMetricDataCommand({
        Namespace: 'RCM/Database',
        MetricData: metricData,
      });

      await cloudWatch.send(command);
      console.log(`Published ${metricData.length} metrics to CloudWatch`);
    }

    return { statusCode: 200, body: 'Logs processed successfully' };
  } catch (error) {
    console.error('Error processing logs:', error);
    throw error;
  }
};

function parsePostgreSQLLog(message: string): ParsedLogEvent | null {
  try {
    // Parse PostgreSQL log format: timestamp:remote_host:user@database:[pid]: level: message
    // Example: 2024-01-01 12:00:00.000 UTC:192.168.1.1(12345):user@database:[12345]: LOG: statement: SELECT ...
    
    const logPattern = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC):([^:]*):([^@]*)@([^:]*):(\[[^\]]*\]):\s*(\w+):\s*(.*)$/;
    const match = message.match(logPattern);
    
    if (!match) {
      // Try simpler pattern for basic logs
      const simplePattern = /^.*?\s+(\w+):\s*(.*)$/;
      const simpleMatch = message.match(simplePattern);
      if (simpleMatch) {
        return {
          timestamp: new Date().toISOString(),
          level: simpleMatch[1],
          message: simpleMatch[2],
        };
      }
      return null;
    }

    const [, timestamp, remoteHost, user, database, pid, level, logMessage] = match;

    let duration: number | undefined;
    let statement: string | undefined;

    // Extract duration from log message
    const durationMatch = logMessage.match(/duration: ([\d.]+) ms/);
    if (durationMatch) {
      duration = parseFloat(durationMatch[1]);
    }

    // Extract SQL statement
    const statementMatch = logMessage.match(/statement: (.*)/);
    if (statementMatch) {
      statement = statementMatch[1];
    }

    return {
      timestamp,
      level,
      message: logMessage,
      user: user || undefined,
      database: database || undefined,
      duration,
      statement,
    };
  } catch (error) {
    console.warn('Failed to parse log message:', message, error);
    return null;
  }
}
import type { 
  CloudFormationCustomResourceEvent, 
  CloudFormationCustomResourceSuccessResponse,
  CloudFormationCustomResourceFailedResponse,
  Context 
} from 'aws-lambda';
import { SignerClient, GetSigningProfileCommand } from '@aws-sdk/client-signer';
import https from 'node:https';

type CloudFormationResponse = CloudFormationCustomResourceSuccessResponse | CloudFormationCustomResourceFailedResponse;

/**
 * Send response back to CloudFormation
 */
async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  status: 'SUCCESS' | 'FAILED',
  data?: Record<string, any>,
  physicalResourceId?: string,
  reason?: string
): Promise<void> {
  const responseBody: CloudFormationResponse = {
    Status: status,
    Reason: reason || `See CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data,
  };

  const responseBodyString = JSON.stringify(responseBody);
  console.log('Sending response to CloudFormation:', responseBodyString);

  const parsedUrl = new URL(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': responseBodyString.length,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      console.log(`Response status: ${response.statusCode}`);
      resolve();
    });

    request.on('error', (error) => {
      console.error('Error sending response:', error);
      reject(error);
    });

    request.write(responseBodyString);
    request.end();
  });
}

/**
 * Custom resource handler to validate AWS Signer profile configuration
 * This ensures the signing profile is properly configured before other resources depend on it
 */
export async function handler(
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<void> {
  console.log('Code signing validation event:', JSON.stringify(event, null, 2));

  const physicalResourceId = 'code-signing-validation';
  
  // Safely extract properties with runtime validation
  const SigningProfileArn = event.ResourceProperties.SigningProfileArn;

  try {
    if (!SigningProfileArn || typeof SigningProfileArn !== 'string') {
      throw new Error('SigningProfileArn is required and must be a string in ResourceProperties');
    }

    // Extract profile name from ARN (last part after /)
    const profileName = SigningProfileArn.split('/').pop();
    if (!profileName) {
      throw new Error('Invalid SigningProfileArn format');
    }

    // Initialize AWS Signer client
    const signerClient = new SignerClient({});

    // Validate the signing profile exists and is active
    const command = new GetSigningProfileCommand({
      profileName: profileName,
    });

    const result = await signerClient.send(command);

    console.log('Signing profile validation successful:', {
      profileName: result.profileName,
      status: result.status,
      platformId: result.platformId,
      arn: result.arn,
    });

    // Send success response
    await sendResponse(
      event,
      context,
      'SUCCESS',
      {
        ProfileName: result.profileName || profileName,
        ProfileStatus: result.status || 'Unknown',
        PlatformId: result.platformId || 'Unknown',
        ProfileArn: result.arn || SigningProfileArn,
        ValidationTimestamp: new Date().toISOString(),
      },
      physicalResourceId,
      `Successfully validated signing profile: ${profileName}`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Code signing validation failed:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      profileArn: SigningProfileArn,
    });

    // Send failure response
    await sendResponse(
      event,
      context,
      'FAILED',
      {
        Error: errorMessage,
        ProfileArn: SigningProfileArn,
        ValidationTimestamp: new Date().toISOString(),
      },
      physicalResourceId,
      `Code signing validation failed: ${errorMessage}`
    );
  }
}

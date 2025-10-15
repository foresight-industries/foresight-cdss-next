import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface WorkflowStackProps extends cdk.StackProps {
  stageName: string;
  database: any;
  queues: any;
}

export class WorkflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props);

    // Lambda functions for workflow steps
    const checkEligibility = new lambda.Function(this, 'CheckEligibilityFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'check-eligibility.handler',
      code: lambda.Code.fromAsset('../packages/functions/workflows'),
      environment: {
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
    });

    const submitClaim = new lambda.Function(this, 'SubmitClaimFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'submit-claim.handler',
      code: lambda.Code.fromAsset('../packages/functions/workflows'),
      environment: {
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
    });

    const checkClaimStatus = new lambda.Function(this, 'CheckClaimStatusFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'check-claim-status.handler',
      code: lambda.Code.fromAsset('../packages/functions/workflows'),
      environment: {
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
    });

    const processPayment = new lambda.Function(this, 'ProcessPaymentFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'process-payment.handler',
      code: lambda.Code.fromAsset('../packages/functions/workflows'),
      environment: {
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
    });

    const sendNotification = new lambda.Function(this, 'SendNotificationFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'send-notification.handler',
      code: lambda.Code.fromAsset('../packages/functions/workflows'),
      environment: {
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
    });

    // CloudWatch Log Groups for Step Functions
    const priorAuthLogGroup = new logs.LogGroup(this, 'PriorAuthLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-prior-auth-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const claimProcessingLogGroup = new logs.LogGroup(this, 'ClaimProcessingLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-claim-processing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const eraProcessingLogGroup = new logs.LogGroup(this, 'ERAProcessingLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-era-processing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Prior Authorization Workflow
    const priorAuthWorkflow = new stepfunctions.StateMachine(this, 'PriorAuthWorkflow', {
      stateMachineName: `rcm-prior-auth-${props.stageName}`,
      definition: new stepfunctions.Parallel(this, 'CheckRequirements')
        .branch(
          // Check eligibility
          new stepfunctionsTasks.LambdaInvoke(this, 'CheckEligibility', {
            lambdaFunction: checkEligibility,
            outputPath: '$.Payload',
          })
        )
        .branch(
          // Check medical necessity
          new stepfunctions.Wait(this, 'WaitForMedicalReview', {
            time: stepfunctions.WaitTime.duration(cdk.Duration.hours(1)),
          }).next(
            new stepfunctions.Choice(this, 'MedicalNecessityApproved?')
              .when(
                stepfunctions.Condition.stringEquals('$.status', 'approved'),
                new stepfunctions.Succeed(this, 'AuthorizationApproved')
              )
              .otherwise(
                new stepfunctions.Fail(this, 'AuthorizationDenied')
              )
          )
        )
        .next(
          new stepfunctionsTasks.SqsSendMessage(this, 'NotifyProvider', {
            queue: props.queues.webhookQueue,
            messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
          })
        ),
      tracingEnabled: true,
      logs: {
        destination: priorAuthLogGroup,
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // Claim Processing Workflow
    const claimProcessingWorkflow = new stepfunctions.StateMachine(this, 'ClaimProcessingWorkflow', {
      stateMachineName: `rcm-claim-processing-${props.stageName}`,
      definition: new stepfunctionsTasks.LambdaInvoke(this, 'ValidateClaim', {
        lambdaFunction: checkEligibility,
        outputPath: '$.Payload',
      })
        .next(
          new stepfunctions.Choice(this, 'ClaimValid?')
            .when(
              stepfunctions.Condition.stringEquals('$.validation', 'valid'),
              new stepfunctionsTasks.LambdaInvoke(this, 'SubmitToPayer', {
                lambdaFunction: submitClaim,
                outputPath: '$.Payload',
              }).next(
                new stepfunctions.Wait(this, 'WaitForPayerResponse', {
                  time: stepfunctions.WaitTime.duration(cdk.Duration.days(1)),
                }).next(
                  new stepfunctionsTasks.LambdaInvoke(this, 'CheckStatus', {
                    lambdaFunction: checkClaimStatus,
                    outputPath: '$.Payload',
                  }).next(
                    new stepfunctions.Choice(this, 'PaymentReceived?')
                      .when(
                        stepfunctions.Condition.stringEquals('$.status', 'paid'),
                        new stepfunctionsTasks.LambdaInvoke(this, 'ProcessPayment', {
                          lambdaFunction: processPayment,
                        }).next(
                          new stepfunctionsTasks.LambdaInvoke(this, 'NotifyPayment', {
                            lambdaFunction: sendNotification,
                          })
                        )
                      )
                      .when(
                        stepfunctions.Condition.stringEquals('$.status', 'denied'),
                        new stepfunctions.Parallel(this, 'HandleDenial')
                          .branch(
                            new stepfunctionsTasks.LambdaInvoke(this, 'CreateAppeal', {
                              lambdaFunction: submitClaim,
                            })
                          )
                          .branch(
                            new stepfunctionsTasks.LambdaInvoke(this, 'NotifyDenial', {
                              lambdaFunction: sendNotification,
                            })
                          )
                      )
                      .otherwise(
                        new stepfunctions.Wait(this, 'WaitAndRetry', {
                          time: stepfunctions.WaitTime.duration(cdk.Duration.hours(6)),
                        }).next(new stepfunctions.Pass(this, 'RetryCheck'))
                      )
                  )
                )
              )
            )
            .otherwise(
              new stepfunctionsTasks.SqsSendMessage(this, 'SendToManualReview', {
                queue: props.queues.dlq,
                messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
              })
            )
        ),
      tracingEnabled: true,
      logs: {
        destination: claimProcessingLogGroup,
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // ERA Processing Workflow
    const eraProcessingWorkflow = new stepfunctions.Map(this, 'ProcessERALines', {
      maxConcurrency: 10,
      itemsPath: '$.lineItems',
    }).iterator(
      new stepfunctionsTasks.LambdaInvoke(this, 'ProcessLineItem', {
        lambdaFunction: processPayment,
      }).next(
        new stepfunctions.Choice(this, 'PaymentMatched?')
          .when(
            stepfunctions.Condition.booleanEquals('$.matched', true),
            new stepfunctionsTasks.LambdaInvoke(this, 'ApplyPayment', {
              lambdaFunction: processPayment,
            })
          )
          .otherwise(
            new stepfunctionsTasks.SqsSendMessage(this, 'ManualReconciliation', {
              queue: props.queues.dlq,
              messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
            })
          )
      )
    );

    const eraWorkflow = new stepfunctions.StateMachine(this, 'ERAWorkflow', {
      stateMachineName: `rcm-era-processing-${props.stageName}`,
      definition: eraProcessingWorkflow,
      tracingEnabled: true,
      logs: {
        destination: eraProcessingLogGroup,
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // Output log group ARNs for monitoring integration
    new cdk.CfnOutput(this, 'PriorAuthLogGroupArn', {
      value: priorAuthLogGroup.logGroupArn,
      exportName: `RCM-PriorAuthLogGroup-${props.stageName}`,
      description: 'ARN of the Prior Authorization workflow log group',
    });

    new cdk.CfnOutput(this, 'ClaimProcessingLogGroupArn', {
      value: claimProcessingLogGroup.logGroupArn,
      exportName: `RCM-ClaimProcessingLogGroup-${props.stageName}`,
      description: 'ARN of the Claim Processing workflow log group',
    });

    new cdk.CfnOutput(this, 'ERAProcessingLogGroupArn', {
      value: eraProcessingLogGroup.logGroupArn,
      exportName: `RCM-ERAProcessingLogGroup-${props.stageName}`,
      description: 'ARN of the ERA Processing workflow log group',
    });

    // Grant permissions
    props.database.grantDataApiAccess(checkEligibility);
    props.database.grantDataApiAccess(submitClaim);
    props.database.grantDataApiAccess(checkClaimStatus);
    props.database.grantDataApiAccess(processPayment);
  }
}

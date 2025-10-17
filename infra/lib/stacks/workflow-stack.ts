import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
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
    const checkEligibility = new lambdaNodejs.NodejsFunction(this, 'CheckEligibilityFn', {
      functionName: `rcm-check-eligibility-${props.stageName}`,
      entry: '../packages/functions/workflows/check-eligibility.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const submitClaim = new lambdaNodejs.NodejsFunction(this, 'SubmitClaimFn', {
      functionName: `rcm-submit-claim-${props.stageName}`,
      entry: '../packages/functions/workflows/submit-claim.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const checkClaimStatus = new lambdaNodejs.NodejsFunction(this, 'CheckClaimStatusFn', {
      functionName: `rcm-check-claim-status-${props.stageName}`,
      entry: '../packages/functions/workflows/check-claim-status.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const processPayment = new lambdaNodejs.NodejsFunction(this, 'ProcessPaymentFn', {
      functionName: `rcm-process-payment-${props.stageName}`,
      entry: '../packages/functions/workflows/process-payment.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const sendNotification = new lambdaNodejs.NodejsFunction(this, 'SendNotificationFn', {
      functionName: `rcm-send-notification-${props.stageName}`,
      entry: '../packages/functions/workflows/send-notification.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(1),
      memorySize: 256,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Prior Authorization Lambda Functions with AWS Comprehend Medical Integration
    
    // Common environment variables for PA functions
    const paEnvironment = {
      NODE_ENV: props.stageName,
      DATABASE_CLUSTER_ARN: props.database.clusterArn,
      DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
      DATABASE_NAME: 'rcm',
      COMPREHEND_MEDICAL_REGION: this.region,
    };

    const validatePriorAuth = new lambdaNodejs.NodejsFunction(this, 'ValidatePriorAuthFn', {
      functionName: `rcm-validate-prior-auth-${props.stageName}`,
      entry: '../packages/functions/workflows/validate-prior-auth.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const extractMedicalEntities = new lambdaNodejs.NodejsFunction(this, 'ExtractMedicalEntitiesFn', {
      functionName: `rcm-extract-medical-entities-${props.stageName}`,
      entry: '../packages/functions/workflows/extract-medical-entities.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1536,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const validateMedicalNecessity = new lambdaNodejs.NodejsFunction(this, 'ValidateMedicalNecessityFn', {
      functionName: `rcm-validate-medical-necessity-${props.stageName}`,
      entry: '../packages/functions/workflows/validate-medical-necessity.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const autoCorrectPriorAuth = new lambdaNodejs.NodejsFunction(this, 'AutoCorrectPriorAuthFn', {
      functionName: `rcm-auto-correct-prior-auth-${props.stageName}`,
      entry: '../packages/functions/workflows/auto-correct-prior-auth.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const submitPriorAuth = new lambdaNodejs.NodejsFunction(this, 'SubmitPriorAuthFn', {
      functionName: `rcm-submit-prior-auth-${props.stageName}`,
      entry: '../packages/functions/workflows/submit-prior-auth.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const analyzeDenialReason = new lambdaNodejs.NodejsFunction(this, 'AnalyzeDenialReasonFn', {
      functionName: `rcm-analyze-denial-reason-${props.stageName}`,
      entry: '../packages/functions/workflows/analyze-denial-reason.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const autoRetryDenial = new lambdaNodejs.NodejsFunction(this, 'AutoRetryDenialFn', {
      functionName: `rcm-auto-retry-denial-${props.stageName}`,
      entry: '../packages/functions/workflows/auto-retry-denial.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: paEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // IAM permissions for AWS Comprehend Medical
    const comprehendMedicalPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'comprehendmedical:DetectEntitiesV2',
        'comprehendmedical:DetectPHI',
        'comprehendmedical:InferICD10CM',
        'comprehendmedical:InferRxNorm',
        'comprehendmedical:InferSNOMEDCT',
        'comprehendmedical:DescribeEntitiesDetectionV2Job',
        'comprehendmedical:DescribePHIDetectionJob',
        'comprehendmedical:DescribeICD10CMInferenceJob',
        'comprehendmedical:DescribeRxNormInferenceJob',
        'comprehendmedical:DescribeSNOMEDCTInferenceJob',
        'comprehendmedical:ListEntitiesDetectionV2Jobs',
        'comprehendmedical:ListPHIDetectionJobs',
        'comprehendmedical:ListICD10CMInferenceJobs',
        'comprehendmedical:ListRxNormInferenceJobs',
        'comprehendmedical:ListSNOMEDCTInferenceJobs',
        'comprehendmedical:StartEntitiesDetectionV2Job',
        'comprehendmedical:StartPHIDetectionJob',
        'comprehendmedical:StartICD10CMInferenceJob',
        'comprehendmedical:StartRxNormInferenceJob',
        'comprehendmedical:StartSNOMEDCTInferenceJob',
        'comprehendmedical:StopEntitiesDetectionV2Job',
        'comprehendmedical:StopPHIDetectionJob',
        'comprehendmedical:StopICD10CMInferenceJob',
        'comprehendmedical:StopRxNormInferenceJob',
        'comprehendmedical:StopSNOMEDCTInferenceJob'
      ],
      resources: ['*'],
    });

    // Grant AWS Comprehend Medical permissions to PA functions
    [validatePriorAuth, extractMedicalEntities, validateMedicalNecessity, 
     autoCorrectPriorAuth, submitPriorAuth, analyzeDenialReason, autoRetryDenial].forEach(fn => {
      fn.addToRolePolicy(comprehendMedicalPolicy);
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

    // Enhanced Prior Authorization Workflow with AWS Comprehend Medical
    const priorAuthWorkflow = new stepfunctions.StateMachine(this, 'PriorAuthWorkflow', {
      stateMachineName: `rcm-prior-auth-${props.stageName}`,
      definition: 
        // Step 1: Initial Validation and Medical Entity Extraction
        new stepfunctionsTasks.LambdaInvoke(this, 'ValidatePriorAuthStep', {
          lambdaFunction: validatePriorAuth,
          outputPath: '$.Payload',
          comment: 'Validate basic PA structure and extract document text',
        })
        .next(
          new stepfunctionsTasks.LambdaInvoke(this, 'ExtractMedicalEntitiesStep', {
            lambdaFunction: extractMedicalEntities,
            outputPath: '$.Payload',
            comment: 'Use AWS Comprehend Medical to extract medical entities and validate codes',
          })
        )
        .next(
          // Step 2: Check for validation issues and auto-correct if possible
          new stepfunctions.Choice(this, 'HasValidationIssues?')
            .when(
              stepfunctions.Condition.and(
                stepfunctions.Condition.isPresent('$.validation_issues'),
                stepfunctions.Condition.numberGreaterThan('$.validation_issues_count', 0)
              ),
              // Auto-correct high confidence issues, flag others for manual review
              new stepfunctionsTasks.LambdaInvoke(this, 'AutoCorrectStep', {
                lambdaFunction: autoCorrectPriorAuth,
                outputPath: '$.Payload',
                comment: 'Auto-correct high confidence validation issues',
              })
              .next(
                new stepfunctions.Choice(this, 'HasRemainingIssues?')
                  .when(
                    stepfunctions.Condition.and(
                      stepfunctions.Condition.isPresent('$.remaining_issues'),
                      stepfunctions.Condition.numberGreaterThan('$.remaining_issues_count', 0)
                    ),
                    // Send to manual review
                    new stepfunctionsTasks.SqsSendMessage(this, 'SendToManualReviewQueue', {
                      queue: props.queues.dlq,
                      messageBody: stepfunctions.TaskInput.fromObject({
                        'priorAuthId.$': '$.priorAuthId',
                        'issues.$': '$.remaining_issues',
                        'reason': 'Validation issues require manual review',
                        'timestamp.$': '$$.State.EnteredTime'
                      }),
                    })
                    .next(new stepfunctions.Succeed(this, 'SentToManualReview'))
                  )
                  .otherwise(
                    new stepfunctions.Pass(this, 'ValidationCorrected', {
                      comment: 'All validation issues auto-corrected'
                    })
                  )
              )
            )
            .otherwise(
              new stepfunctions.Pass(this, 'NoValidationIssues', {
                comment: 'PA passed initial validation'
              })
            )
        )
        .next(
          // Step 3: Parallel eligibility and medical necessity validation
          new stepfunctions.Parallel(this, 'ParallelValidation', {
            comment: 'Run eligibility and medical necessity checks in parallel'
          })
          .branch(
            // Branch 1: Eligibility Check
            new stepfunctionsTasks.LambdaInvoke(this, 'CheckEligibilityParallel', {
              lambdaFunction: checkEligibility,
              outputPath: '$.Payload',
              comment: 'Verify patient eligibility and coverage'
            })
          )
          .branch(
            // Branch 2: Medical Necessity Validation
            new stepfunctionsTasks.LambdaInvoke(this, 'ValidateMedicalNecessityStep', {
              lambdaFunction: validateMedicalNecessity,
              outputPath: '$.Payload',
              comment: 'Use AWS Comprehend Medical to validate medical necessity'
            })
          )
        )
        .next(
          // Step 4: Evaluate results and decide on submission
          new stepfunctions.Choice(this, 'ReadyForSubmission?')
            .when(
              stepfunctions.Condition.and(
                stepfunctions.Condition.stringEquals('$[0].eligible', 'true'),
                stepfunctions.Condition.numberGreaterThan('$[1].medical_necessity_confidence', 85),
                stepfunctions.Condition.stringEquals('$[1].recommendation', 'approve')
              ),
              // Auto-submit PA
              new stepfunctionsTasks.LambdaInvoke(this, 'SubmitPriorAuthStep', {
                lambdaFunction: submitPriorAuth,
                inputPath: '$',
                outputPath: '$.Payload',
                comment: 'Auto-submit PA to payer',
              })
              .next(
                new stepfunctions.Choice(this, 'SubmissionSuccessful?')
                  .when(
                    stepfunctions.Condition.stringEquals('$.submission_status', 'success'),
                    // Wait for payer response
                    new stepfunctions.Wait(this, 'WaitForPayerResponse', {
                      time: stepfunctions.WaitTime.duration(cdk.Duration.hours(24)),
                    })
                    .next(
                      new stepfunctionsTasks.LambdaInvoke(this, 'CheckPAStatus', {
                        lambdaFunction: checkClaimStatus,
                        outputPath: '$.Payload',
                        comment: 'Check PA status with payer'
                      })
                      .next(
                        new stepfunctions.Choice(this, 'PAResponseReceived?')
                          .when(
                            stepfunctions.Condition.stringEquals('$.status', 'approved'),
                            // PA Approved - Success
                            new stepfunctionsTasks.LambdaInvoke(this, 'NotifyApproval', {
                              lambdaFunction: sendNotification,
                              inputPath: '$',
                            })
                            .next(new stepfunctions.Succeed(this, 'PAApproved'))
                          )
                          .when(
                            stepfunctions.Condition.stringEquals('$.status', 'denied'),
                            // PA Denied - Analyze and potentially retry
                            new stepfunctionsTasks.LambdaInvoke(this, 'AnalyzeDenialStep', {
                              lambdaFunction: analyzeDenialReason,
                              outputPath: '$.Payload',
                              comment: 'Analyze denial reason using AWS Comprehend Medical'
                            })
                            .next(
                              new stepfunctions.Choice(this, 'CanAutoRetry?')
                                .when(
                                  stepfunctions.Condition.and(
                                    stepfunctions.Condition.booleanEquals('$.auto_retry_possible', true),
                                    stepfunctions.Condition.numberLessThan('$.retry_count', 3)
                                  ),
                                  // Auto-retry with corrections
                                  new stepfunctionsTasks.LambdaInvoke(this, 'AutoRetryDenialStep', {
                                    lambdaFunction: autoRetryDenial,
                                    outputPath: '$.Payload',
                                    comment: 'Auto-retry PA with corrections based on denial reason'
                                  })
                                  .next(
                                    new stepfunctions.Wait(this, 'WaitBeforeRetry', {
                                      time: stepfunctions.WaitTime.duration(cdk.Duration.hours(2)),
                                    })
                                    .next(
                                      new stepfunctionsTasks.LambdaInvoke(this, 'ResubmitPriorAuth', {
                                        lambdaFunction: submitPriorAuth,
                                        outputPath: '$.Payload',
                                        comment: 'Resubmit corrected PA'
                                      })
                                      .next(
                                        new stepfunctions.Choice(this, 'RetrySubmissionSuccessful?')
                                          .when(
                                            stepfunctions.Condition.stringEquals('$.submission_status', 'success'),
                                            new stepfunctions.Wait(this, 'WaitForRetryResponse', {
                                              time: stepfunctions.WaitTime.duration(cdk.Duration.hours(24)),
                                            })
                                            .next(
                                              new stepfunctionsTasks.LambdaInvoke(this, 'CheckRetryStatus', {
                                                lambdaFunction: checkClaimStatus,
                                                outputPath: '$.Payload',
                                              })
                                              .next(
                                                new stepfunctions.Choice(this, 'RetryApproved?')
                                                  .when(
                                                    stepfunctions.Condition.stringEquals('$.status', 'approved'),
                                                    new stepfunctionsTasks.LambdaInvoke(this, 'NotifyRetrySuccess', {
                                                      lambdaFunction: sendNotification,
                                                    })
                                                    .next(new stepfunctions.Succeed(this, 'PAApprovedOnRetry'))
                                                  )
                                                  .otherwise(
                                                    // Send to manual review after failed retry
                                                    new stepfunctionsTasks.SqsSendMessage(this, 'SendFailedRetryToReview', {
                                                      queue: props.queues.dlq,
                                                      messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
                                                    })
                                                    .next(new stepfunctions.Succeed(this, 'SentToManualReviewAfterRetry'))
                                                  )
                                              )
                                            )
                                          )
                                          .otherwise(
                                            new stepfunctionsTasks.SqsSendMessage(this, 'SendRetryFailureToReview', {
                                              queue: props.queues.dlq,
                                              messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
                                            })
                                            .next(new stepfunctions.Succeed(this, 'RetrySubmissionFailed'))
                                          )
                                      )
                                    )
                                  )
                                )
                                .otherwise(
                                  // Send to manual review
                                  new stepfunctionsTasks.SqsSendMessage(this, 'SendDenialToReview', {
                                    queue: props.queues.dlq,
                                    messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
                                  })
                                  .next(new stepfunctions.Succeed(this, 'DenialSentToManualReview'))
                                )
                            )
                          )
                          .otherwise(
                            // Still pending - could implement additional wait/retry logic here
                            new stepfunctionsTasks.SqsSendMessage(this, 'SendPendingToReview', {
                              queue: props.queues.dlq,
                              messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
                            })
                            .next(new stepfunctions.Succeed(this, 'PendingResponse'))
                          )
                      )
                    )
                  )
                  .otherwise(
                    // Submission failed
                    new stepfunctionsTasks.SqsSendMessage(this, 'SendSubmissionFailureToReview', {
                      queue: props.queues.dlq,
                      messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
                    })
                    .next(new stepfunctions.Succeed(this, 'SubmissionFailed'))
                  )
              )
            )
            .otherwise(
              // Not ready for auto-submission - send to manual review
              new stepfunctionsTasks.SqsSendMessage(this, 'SendToManualReviewFinal', {
                queue: props.queues.dlq,
                messageBody: stepfunctions.TaskInput.fromObject({
                  'priorAuthId.$': '$.priorAuthId',
                  'eligibility.$': '$[0]',
                  'medicalNecessity.$': '$[1]',
                  'reason': 'PA requires manual review before submission',
                  'timestamp.$': '$$.State.EnteredTime'
                }),
              })
              .next(new stepfunctions.Succeed(this, 'SentToManualReviewNotReady'))
            )
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
    
    // Grant database access to PA functions
    [validatePriorAuth, extractMedicalEntities, validateMedicalNecessity, 
     autoCorrectPriorAuth, submitPriorAuth, analyzeDenialReason, autoRetryDenial].forEach(fn => {
      props.database.grantDataApiAccess(fn);
    });
  }
}

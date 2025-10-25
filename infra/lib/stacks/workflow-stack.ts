import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import type { Construct } from 'constructs';

interface WorkflowStackProps extends cdk.StackProps {
  stageName: string;
  database: any;
  codeSigningConfigArn?: string;
}

export class WorkflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props);

    // Import DLQ from the queue stack using CloudFormation import
    const dlqArn = cdk.Fn.importValue(`RCM-DLQArn-${props.stageName}`);
    const dlq = sqs.Queue.fromQueueArn(this, 'ImportedDLQ', dlqArn);

    // Import code signing configuration if provided
    let codeSigningConfig: lambda.ICodeSigningConfig | undefined;
    if (props.codeSigningConfigArn) {
      codeSigningConfig = lambda.CodeSigningConfig.fromCodeSigningConfigArn(
        this, 'ImportedCodeSigningConfig', props.codeSigningConfigArn
      );
    }

    // KMS key for workflow log encryption (HIPAA compliance)
    const workflowKmsKey = new kms.Key(this, 'WorkflowKmsKey', {
      description: `KMS key for workflow log encryption - ${props.stageName}`,
      enableKeyRotation: true,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Allow CloudWatch Logs service to use the key
    workflowKmsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal(`logs.${cdk.Stack.of(this).region}.amazonaws.com`)],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:DescribeKey',
      ],
      resources: ['*'],
    }));

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

    // Log group for send notification function
    const sendNotificationLogGroup = new logs.LogGroup(this, 'SendNotificationLogGroup', {
      logGroupName: `/aws/lambda/rcm-send-notification-${props.stageName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: workflowKmsKey,
    });

    const sendNotification = new lambdaNodejs.NodejsFunction(this, 'SendNotificationFn', {
      functionName: `rcm-send-notification-${props.stageName}`,
      entry: '../packages/functions/workflows/send-notification.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(1),
      memorySize: 256,
      logGroup: sendNotificationLogGroup,
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

    // Specialty Classification Function
    const classifySpecialty = new lambdaNodejs.NodejsFunction(this, 'ClassifySpecialtyFn', {
      functionName: `rcm-classify-specialty-${props.stageName}`,
      entry: '../packages/functions/workflows/classify-specialty.ts',
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
     autoCorrectPriorAuth, submitPriorAuth, analyzeDenialReason, autoRetryDenial, classifySpecialty].forEach(fn => {
      fn.addToRolePolicy(comprehendMedicalPolicy);
    });

    // Add code signing tags and configure functions if available
    if (codeSigningConfig) {
      const allLambdaFunctions = [
        checkEligibility, submitClaim, checkClaimStatus, processPayment, sendNotification,
        validatePriorAuth, extractMedicalEntities, validateMedicalNecessity,
        autoCorrectPriorAuth, submitPriorAuth, analyzeDenialReason, autoRetryDenial, classifySpecialty
      ];

      // Add tags for compliance tracking
      for (const fn of allLambdaFunctions) {
        cdk.Tags.of(fn).add('CodeSigning', 'Enabled');
        cdk.Tags.of(fn).add('SecurityCompliance', 'HealthcareRCM');
      }
    }

    // CloudWatch Log Groups for Step Functions
    const priorAuthLogGroup = new logs.LogGroup(this, 'PriorAuthLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-prior-auth-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: workflowKmsKey,
    });

    const claimProcessingLogGroup = new logs.LogGroup(this, 'ClaimProcessingLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-claim-processing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: workflowKmsKey,
    });

    const eraProcessingLogGroup = new logs.LogGroup(this, 'ERAProcessingLogGroup', {
      logGroupName: `/aws/stepfunctions/rcm-era-processing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: workflowKmsKey,
    });

    // Create the main workflow states that will be reused
    const parallelValidation = new stepfunctions.Parallel(this, 'ParallelValidation', {
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
    );

    // Step 4: Evaluate results and decide on submission
    const submissionChoice = new stepfunctions.Choice(this, 'ReadyForSubmission?')
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
              new stepfunctions.Succeed(this, 'PASubmitted')
            )
            .otherwise(
              new stepfunctions.Succeed(this, 'SubmissionFailed')
            )
        )
      )
      .otherwise(
        // Not ready for submission
        new stepfunctions.Succeed(this, 'NotReadyForSubmission')
      );

    const mainWorkflowChain = stepfunctions.Chain.start(parallelValidation).next(submissionChoice);

    // Create specialty-specific workflow branches
    const weightLossWorkflowBranch = new stepfunctionsTasks.LambdaInvoke(this, 'WeightLossValidation', {
      lambdaFunction: validateMedicalNecessity,
      inputPath: '$',
      outputPath: '$.Payload',
      comment: 'Weight loss specialty-specific validation using dynamic configuration',
    })
    .next(mainWorkflowChain);

    const genericWorkflowBranch = new stepfunctionsTasks.LambdaInvoke(this, 'GenericValidation', {
      lambdaFunction: validateMedicalNecessity,
      inputPath: '$',
      outputPath: '$.Payload',
      comment: 'Generic medical validation for non-specialized workflows',
    })
    .next(mainWorkflowChain);

    // Enhanced Prior Authorization Workflow with Specialty Classification and Dynamic Branching
    const priorAuthWorkflow = new stepfunctions.StateMachine(this, 'PriorAuthWorkflow', {
      stateMachineName: `rcm-prior-auth-${props.stageName}`,
      definitionBody: stepfunctions.DefinitionBody.fromChainable(
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
          // Step 2: Classify Medical Specialty
          new stepfunctionsTasks.LambdaInvoke(this, 'ClassifySpecialtyStep', {
            lambdaFunction: classifySpecialty,
            outputPath: '$.Payload',
            comment: 'Classify medical specialty and load dynamic configuration',
          })
        )
        .next(
          // Step 3: Check for validation issues and auto-correct if possible
          new stepfunctions.Choice(this, 'HasValidationIssues?')
            .when(
              stepfunctions.Condition.and(
                stepfunctions.Condition.isPresent('$.validation_issues'),
                stepfunctions.Condition.numberGreaterThan('$.validation_issues_count', 0)
              ),
              // Autocorrect high confidence issues, flag others for manual review
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
                      queue: dlq,
                      messageBody: stepfunctions.TaskInput.fromObject({
                        'priorAuthId.$': '$.priorAuthId',
                        'issues.$': '$.remaining_issues',
                        'specialty.$': '$.specialty',
                        'reason': 'Validation issues require manual review',
                        'timestamp.$': '$$.State.EnteredTime'
                      }),
                    })
                    .next(new stepfunctions.Succeed(this, 'SentToManualReview'))
                  )
                  .otherwise(
                    // Continue to specialty routing
                    new stepfunctions.Choice(this, 'SpecialtyRouter')
                      .when(
                        stepfunctions.Condition.stringEquals('$.specialty', 'WEIGHT_LOSS'),
                        weightLossWorkflowBranch
                      )
                      .when(
                        stepfunctions.Condition.or(
                          stepfunctions.Condition.stringEquals('$.specialty', 'CARDIOLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'ONCOLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'GASTROENTEROLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'ENDOCRINOLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'DERMATOLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'ORTHOPEDICS'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'NEUROLOGY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'PSYCHIATRY'),
                          stepfunctions.Condition.stringEquals('$.specialty', 'RHEUMATOLOGY')
                        ),
                        // Future specialty-specific workflows will be added here
                        genericWorkflowBranch
                      )
                      .otherwise(
                        // Default to generic workflow for unrecognized specialties
                        genericWorkflowBranch
                      )
                  )
              )
            )
            .otherwise(
              // No validation issues - proceed to specialty routing
              new stepfunctions.Choice(this, 'SpecialtyRouterNoIssues')
                .when(
                  stepfunctions.Condition.stringEquals('$.specialty', 'WEIGHT_LOSS'),
                  weightLossWorkflowBranch
                )
                .when(
                  stepfunctions.Condition.or(
                    stepfunctions.Condition.stringEquals('$.specialty', 'CARDIOLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'ONCOLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'GASTROENTEROLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'ENDOCRINOLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'DERMATOLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'ORTHOPEDICS'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'NEUROLOGY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'PSYCHIATRY'),
                    stepfunctions.Condition.stringEquals('$.specialty', 'RHEUMATOLOGY')
                  ),
                  // Future specialty-specific workflows will be added here
                  genericWorkflowBranch
                )
                .otherwise(
                  // Default to generic workflow for unrecognized specialties
                  genericWorkflowBranch
                )
            )
        ),
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
      definitionBody: stepfunctions.DefinitionBody.fromChainable(
        new stepfunctionsTasks.LambdaInvoke(this, 'ValidateClaim', {
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
                queue: dlq,
                messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
              })
            )
        ),
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
    }).itemProcessor(
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
              queue: dlq,
              messageBody: stepfunctions.TaskInput.fromJsonPathAt('$'),
            })
          )
      )
    );

    const eraWorkflow = new stepfunctions.StateMachine(this, 'ERAWorkflow', {
      stateMachineName: `rcm-era-processing-${props.stageName}`,
      definitionBody: stepfunctions.DefinitionBody.fromChainable(eraProcessingWorkflow),
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
     autoCorrectPriorAuth, submitPriorAuth, analyzeDenialReason, autoRetryDenial, classifySpecialty].forEach(fn => {
      props.database.grantDataApiAccess(fn);
    });
  }
}

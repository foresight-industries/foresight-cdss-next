import { Stack, type StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'node:path';

export interface ComprehendMedicalStackProps extends StackProps {
  environment: 'staging' | 'prod';
  databaseClusterArn: string;
  databaseSecretArn: string;
}

export class ComprehendMedicalStack extends Stack {
  public readonly medicalEntityExtractionFunction: lambda.Function;
  public readonly encounterProcessingRole: iam.Role;

  constructor(scope: Construct, id: string, props: ComprehendMedicalStackProps) {
    super(scope, id, props);

    // IAM role for Comprehend Medical processing
    this.encounterProcessingRole = new iam.Role(this, 'ComprehendMedicalRole', {
      roleName: `foresight-${props.environment}-comprehend-medical`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        ComprehendMedicalPolicy: new iam.PolicyDocument({
          statements: [
            // Comprehend Medical permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'comprehendmedical:DetectEntitiesV2',
                'comprehendmedical:DetectPHI',
                'comprehendmedical:InferICD10CM',
                'comprehendmedical:InferRxNorm',
                'comprehendmedical:InferSNOMEDCT',
              ],
              resources: ['*'], // Comprehend Medical doesn't support resource-level permissions
            }),
            // RDS Data API access for database updates
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds-data:BeginTransaction',
                'rds-data:CommitTransaction',
                'rds-data:ExecuteStatement',
                'rds-data:RollbackTransaction',
              ],
              resources: [props.databaseClusterArn],
            }),
            // Secrets Manager access for database credentials
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [props.databaseSecretArn],
            }),
            // EventBridge permissions for publishing processing results
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'events:PutEvents',
              ],
              resources: [
                `arn:aws:events:${this.region}:${this.account}:event-bus/default`,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda function for medical entity extraction
    this.medicalEntityExtractionFunction = new lambda.Function(this, 'MedicalEntityExtractionFunction', {
      functionName: `foresight-${props.environment}-medical-entity-extraction`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'workers/medical-entity-extraction.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../packages/functions')),
      timeout: Duration.minutes(15), // Comprehend Medical can take time for large texts
      memorySize: 1024,
      role: this.encounterProcessingRole,
      environment: {
        DATABASE_CLUSTER_ARN: props.databaseClusterArn,
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        ENVIRONMENT: props.environment,
        LOG_LEVEL: props.environment === 'prod' ? 'warn' : 'debug',
      },
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
    });

    // EventBridge rule to trigger on encounter updates
    const encounterUpdateRule = new events.Rule(this, 'EncounterUpdateRule', {
      ruleName: `foresight-${props.environment}-encounter-clinical-notes-update`,
      description: 'Triggers medical entity extraction when encounter clinical notes are updated',
      eventPattern: {
        source: ['foresight.encounters'],
        detailType: ['Encounter Updated'],
        detail: {
          // Trigger only when clinical_notes field is updated and not empty
          changedFields: events.Match.anyOf(['clinical_notes']),
          clinicalNotes: events.Match.exists(),
        },
      },
    });

    // Add Lambda function as target for the EventBridge rule
    encounterUpdateRule.addTarget(new targets.LambdaFunction(this.medicalEntityExtractionFunction, {
      retryAttempts: 2,
      maxEventAge: Duration.hours(2),
    }));

    // Custom EventBridge rule for manual processing (for backfill or testing)
    const manualProcessingRule = new events.Rule(this, 'ManualProcessingRule', {
      ruleName: `foresight-${props.environment}-manual-medical-entity-extraction`,
      description: 'Manual trigger for medical entity extraction',
      eventPattern: {
        source: ['foresight.manual'],
        detailType: ['Process Medical Entities'],
      },
    });

    manualProcessingRule.addTarget(new targets.LambdaFunction(this.medicalEntityExtractionFunction, {
      retryAttempts: 2,
      maxEventAge: Duration.hours(2),
    }));

    // Store configuration in SSM
    new ssm.StringParameter(this, 'ComprehendMedicalFunctionName', {
      parameterName: `/foresight/${props.environment}/comprehend/function-name`,
      stringValue: this.medicalEntityExtractionFunction.functionName,
      description: 'Lambda function name for Comprehend Medical entity extraction',
    });

    new ssm.StringParameter(this, 'ComprehendMedicalFunctionArn', {
      parameterName: `/foresight/${props.environment}/comprehend/function-arn`,
      stringValue: this.medicalEntityExtractionFunction.functionArn,
      description: 'Lambda function ARN for Comprehend Medical entity extraction',
    });

    new ssm.StringParameter(this, 'EncounterUpdateRuleName', {
      parameterName: `/foresight/${props.environment}/comprehend/encounter-rule-name`,
      stringValue: encounterUpdateRule.ruleName,
      description: 'EventBridge rule name for encounter updates',
    });

    // Entity mapping configuration for field population
    new ssm.StringParameter(this, 'EntityMappingConfig', {
      parameterName: `/foresight/${props.environment}/comprehend/entity-mapping`,
      stringValue: JSON.stringify({
        MEDICAL_CONDITION: ['chiefComplaint', 'presentIllness', 'assessment'],
        DX_NAME: ['primaryDiagnosis', 'secondaryDiagnoses'],
        PROCEDURE_NAME: ['procedureCodes'],
        TREATMENT: ['plan'],
        MEDICATION: ['plan'], // Can be combined with treatment plan
      }),
      description: 'Mapping of Comprehend Medical entity types to encounter table fields',
    });

    // Processing settings
    new ssm.StringParameter(this, 'ProcessingSettings', {
      parameterName: `/foresight/${props.environment}/comprehend/processing-settings`,
      stringValue: JSON.stringify({
        maxTextLength: 20000, // Comprehend Medical limit
        confidenceThreshold: 0.7, // Minimum confidence for entity extraction
        onlyPopulateEmptyFields: true, // Only populate fields that are currently empty
        enablePHIDetection: true, // Detect PHI for compliance
        enableInference: true, // Use inference APIs for ICD-10, RxNorm, SNOMED CT
      }),
      description: 'Configuration settings for Comprehend Medical processing',
    });

    // Outputs
    new CfnOutput(this, 'MedicalEntityExtractionFunctionArn', {
      value: this.medicalEntityExtractionFunction.functionArn,
      description: 'ARN of the medical entity extraction Lambda function',
      exportName: `${this.stackName}-medical-entity-extraction-function-arn`,
    });

    new CfnOutput(this, 'MedicalEntityExtractionFunctionName', {
      value: this.medicalEntityExtractionFunction.functionName,
      description: 'Name of the medical entity extraction Lambda function',
      exportName: `${this.stackName}-medical-entity-extraction-function-name`,
    });

    new CfnOutput(this, 'ComprehendMedicalRoleArn', {
      value: this.encounterProcessingRole.roleArn,
      description: 'ARN of the Comprehend Medical processing role',
      exportName: `${this.stackName}-comprehend-medical-role-arn`,
    });

    new CfnOutput(this, 'EncounterUpdateRuleArn', {
      value: encounterUpdateRule.ruleArn,
      description: 'ARN of the encounter update EventBridge rule',
      exportName: `${this.stackName}-encounter-update-rule-arn`,
    });
  }

  /**
   * Get policy statements for functions that need to trigger medical entity extraction
   */
  public getTriggerPolicyStatements() {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'events:PutEvents',
        ],
        resources: [
          `arn:aws:events:${this.region}:${this.account}:event-bus/default`,
        ],
      }),
    ];
  }

  /**
   * Get environment variables for integration with this stack
   */
  public getIntegrationEnvironmentVariables(): Record<string, string> {
    return {
      COMPREHEND_MEDICAL_FUNCTION_NAME: this.medicalEntityExtractionFunction.functionName,
      COMPREHEND_MEDICAL_FUNCTION_ARN: this.medicalEntityExtractionFunction.functionArn,
    };
  }
}

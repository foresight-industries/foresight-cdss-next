import * as cdk from 'aws-cdk-lib';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import type { Construct } from 'constructs';

export interface SecurityHubStackProps extends cdk.StackProps {
  stageName: string;
  securityEmail?: string;
  configTopicArn?: string;
}

export class SecurityHubStack extends cdk.Stack {
  public readonly securityHub: securityhub.CfnHub;
  public readonly securityTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: SecurityHubStackProps) {
    super(scope, id, props);

    // Enable Security Hub
    this.securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      tags: {
        'Purpose': 'HealthcareCompliance',
        'Environment': props.stageName,
        'HIPAA': 'Required',
      },
    });

    // KMS key for Security Hub encryption
    const securityHubKmsKey = new kms.Key(this, 'SecurityHubKmsKey', {
      description: 'KMS key for Security Hub encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable Root Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow Security Hub Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('securityhub.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow SNS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // SNS topic for Security Hub findings
    this.securityTopic = new sns.Topic(this, 'SecurityHubTopic', {
      topicName: `rcm-security-findings-${props.stageName}`,
      displayName: 'Security Hub Findings & Alerts',
      enforceSSL: true,
      masterKey: securityHubKmsKey,
    });

    // Add email subscription if provided
    if (props.securityEmail) {
      this.securityTopic.addSubscription(
        new subscriptions.EmailSubscription(props.securityEmail)
      );
    }

    // Enable healthcare-relevant security standards
    this.enableHealthcareSecurityStandards();

    // Set up Config integration with Security Hub
    this.setupConfigIntegration();

    // Set up EventBridge rules for critical findings
    this.setupCriticalFindingsAlerts();

    // Custom insights for healthcare compliance
    this.createHealthcareInsights();

    // Outputs
    new cdk.CfnOutput(this, 'SecurityHubArn', {
      value: this.securityHub.attrArn,
      exportName: `RCM-SecurityHub-${props.stageName}`,
      description: 'ARN of the Security Hub instance',
    });

    new cdk.CfnOutput(this, 'SecurityTopicArn', {
      value: this.securityTopic.topicArn,
      exportName: `RCM-SecurityTopic-${props.stageName}`,
      description: 'SNS topic for security findings',
    });

    // Tag all resources for compliance tracking
    cdk.Tags.of(this).add('Purpose', 'SecurityCompliance');
    cdk.Tags.of(this).add('HealthcareCompliance', 'HIPAA');
    cdk.Tags.of(this).add('Environment', props.stageName);
  }

  private enableHealthcareSecurityStandards(): void {
    // AWS Foundational Security Standard (core security controls)
    new securityhub.CfnStandard(this, 'FoundationalSecurityStandard', {
      standardsArn: `arn:aws:securityhub:::standard/aws-foundational-security/v/1.0.0`,
      disabledStandardsControls: [
        // Disable controls that don't apply to healthcare/serverless
        { standardsControlArn: 'arn:aws:securityhub:us-east-1::control/aws-foundational-security/v/1.0.0/EC2.1', reason: 'Serverless architecture - no EC2 instances' },
        { standardsControlArn: 'arn:aws:securityhub:us-east-1::control/aws-foundational-security/v/1.0.0/EC2.2', reason: 'Serverless architecture - no EC2 instances' },
      ],
    });

    // CIS AWS Foundations Benchmark (healthcare industry standard)
    new securityhub.CfnStandard(this, 'CISFoundationsBenchmark', {
      standardsArn: `arn:aws:securityhub:::standard/cis-aws-foundations-benchmark/v/1.2.0`,
      disabledStandardsControls: [
        // Disable controls that don't apply to serverless healthcare architecture
        { standardsControlArn: 'arn:aws:securityhub:us-east-1::control/cis-aws-foundations-benchmark/v/1.2.0/2.1', reason: 'CloudTrail configured at account level' },
      ],
    });

    // PCI DSS (if handling payment information)
    if (this.stackName.includes('prod')) {
      new securityhub.CfnStandard(this, 'PCIDSSStandard', {
        standardsArn: `arn:aws:securityhub:::standard/pci-dss/v/3.2.1`,
        disabledStandardsControls: [
          // Disable controls that don't apply to serverless
          { standardsControlArn: 'arn:aws:securityhub:us-east-1::control/pci-dss/v/3.2.1/PCI.EC2.1', reason: 'Serverless architecture' },
        ],
      });
    }
  }

  private setupConfigIntegration(): void {
    // This automatically enables Config findings to flow into Security Hub
    // AWS Config findings will appear in Security Hub dashboard

    // Config service-linked role for Security Hub integration
    const configServiceRole = new iam.Role(this, 'ConfigSecurityHubRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      description: 'Role for Config to send findings to Security Hub',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityHubServiceRolePolicy'),
      ],
    });

    // Grant Config permission to publish to Security Hub
    configServiceRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'securityhub:BatchImportFindings',
        'securityhub:GetFindings',
      ],
      resources: [this.securityHub.attrArn],
    }));

    // Enable Config findings integration in Security Hub
    new securityhub.CfnProductSubscription(this, 'ConfigIntegration', {
      productArn: `arn:aws:securityhub:${this.region}:${this.account}:product/aws/config`,
    });
  }

  private setupCriticalFindingsAlerts(): void {
    // EventBridge rule for HIGH and CRITICAL severity findings
    const criticalFindingsRule = new events.Rule(this, 'CriticalSecurityFindings', {
      ruleName: `rcm-critical-security-findings-${this.stackName}`,
      description: 'Alert on HIGH and CRITICAL Security Hub findings',
      eventPattern: {
        source: ['aws.securityhub'],
        detailType: ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Severity: {
              Label: ['HIGH', 'CRITICAL'],
            },
            Workflow: {
              Status: ['NEW', 'NOTIFIED'],
            },
          },
        },
      },
    });

    // Send critical findings to SNS
    criticalFindingsRule.addTarget(new targets.SnsTopic(this.securityTopic));

    // EventBridge rule for HIPAA-related compliance findings
    const hipaaComplianceRule = new events.Rule(this, 'HIPAAComplianceFindings', {
      ruleName: `rcm-hipaa-compliance-findings-${this.stackName}`,
      description: 'Alert on HIPAA compliance-related findings',
      eventPattern: {
        source: ['aws.securityhub'],
        detailType: ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Title: [
              { prefix: 'S3' },
              { prefix: 'RDS' },
              { prefix: 'Lambda' },
              { prefix: 'CloudTrail' },
              { prefix: 'Encryption' },
            ],
            Compliance: {
              Status: ['FAILED'],
            },
          },
        },
      },
    });

    hipaaComplianceRule.addTarget(new targets.SnsTopic(this.securityTopic));

    // EventBridge rule for code signing violations
    const codeSigningRule = new events.Rule(this, 'CodeSigningViolations', {
      ruleName: `rcm-code-signing-violations-${this.stackName}`,
      description: 'Alert on Lambda code signing violations',
      eventPattern: {
        source: ['aws.securityhub'],
        detailType: ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Resources: {
              Type: ['AwsLambdaFunction'],
            },
            Title: [
              { prefix: 'Lambda' },
              { prefix: 'Code signing' },
            ],
            Compliance: {
              Status: ['FAILED'],
            },
          },
        },
      },
    });

    codeSigningRule.addTarget(new targets.SnsTopic(this.securityTopic));
  }

  private createHealthcareInsights(): void {
    // Custom insight for encryption compliance
    new securityhub.CfnInsight(this, 'EncryptionComplianceInsight', {
      name: `Healthcare Encryption Compliance - ${this.stackName}`,
      filters: {
        complianceStatus: [{ value: 'FAILED', comparison: 'EQUALS' }],
        title: [
          { value: 'encryption', comparison: 'CONTAINS' },
          { value: 'encrypted', comparison: 'CONTAINS' },
          { value: 'SSL', comparison: 'CONTAINS' },
        ],
      },
      groupByAttribute: 'ResourceType',
    });

    // Custom insight for access control failures
    new securityhub.CfnInsight(this, 'AccessControlInsight', {
      name: `Healthcare Access Control Failures - ${this.stackName}`,
      filters: {
        complianceStatus: [{ value: 'FAILED', comparison: 'EQUALS' }],
        title: [
          { value: 'public', comparison: 'CONTAINS' },
          { value: 'access', comparison: 'CONTAINS' },
          { value: 'MFA', comparison: 'CONTAINS' },
          { value: 'authentication', comparison: 'CONTAINS' },
        ],
      },
      groupByAttribute: 'ResourceType',
    });

    // Custom insight for audit trail compliance
    new securityhub.CfnInsight(this, 'AuditTrailInsight', {
      name: `Healthcare Audit Trail Compliance - ${this.stackName}`,
      filters: {
        complianceStatus: [{ value: 'FAILED', comparison: 'EQUALS' }],
        title: [
          { value: 'CloudTrail', comparison: 'CONTAINS' },
          { value: 'logging', comparison: 'CONTAINS' },
          { value: 'audit', comparison: 'CONTAINS' },
        ],
      },
      groupByAttribute: 'ResourceType',
    });

    // Custom insight for Lambda security
    new securityhub.CfnInsight(this, 'LambdaSecurityInsight', {
      name: `Lambda Security Compliance - ${this.stackName}`,
      filters: {
        resourceType: [{ value: 'AwsLambdaFunction', comparison: 'EQUALS' }],
        complianceStatus: [{ value: 'FAILED', comparison: 'EQUALS' }],
      },
      groupByAttribute: 'Title',
    });

    // Custom insight for database security
    new securityhub.CfnInsight(this, 'DatabaseSecurityInsight', {
      name: `Database Security Compliance - ${this.stackName}`,
      filters: {
        resourceType: [
          { value: 'AwsRdsDbCluster', comparison: 'EQUALS' },
          { value: 'AwsRdsDbInstance', comparison: 'EQUALS' },
        ],
        complianceStatus: [{ value: 'FAILED', comparison: 'EQUALS' }],
      },
      groupByAttribute: 'Title',
    });
  }
}

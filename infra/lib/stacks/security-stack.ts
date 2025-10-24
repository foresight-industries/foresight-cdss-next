import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { randomBytes } from 'node:crypto';

interface SecurityStackProps extends cdk.StackProps {
  stageName: string;
  api: apigateway.HttpApi;
}

export class SecurityStack extends cdk.Stack {
  public readonly credentialEncryptionKey: kms.Key;
  public readonly credentialManagementRole: iam.Role;
  public readonly credentialAuditLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // S3 bucket for WAF logs
    const wafLogsBucket = new s3.Bucket(this, 'WAFLogsBucket', {
      bucketName: `rcm-waf-logs-${props.stageName}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        id: 'delete-old-logs',
        expiration: cdk.Duration.days(90),
      }],
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Kinesis Firehose for WAF logging
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    wafLogsBucket.grantWrite(firehoseRole);
    firehoseRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetBucketLocation', 's3:ListBucket', 's3:ListBucketMultipartUploads'],
      resources: [wafLogsBucket.bucketArn],
    }));

    const wafLogsFirehoseKey = new kms.CfnKey(this, 'WAFLogsFirehoseKey', {
      description: 'KMS key for encrypting WAF logs stream',
      enableKeyRotation: true,
      keyPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'EnableRootPermissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowApplicationAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('firehose.amazonaws.com')],
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    const wafLogsFirehose = new kinesisfirehose.CfnDeliveryStream(this, 'WAFLogsFirehose', {
      deliveryStreamName: `aws-waf-logs-rcm-${props.stageName}`,
      deliveryStreamType: 'DirectPut',
      s3DestinationConfiguration: {
        bucketArn: wafLogsBucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        prefix: 'waf-logs/',
        errorOutputPrefix: 'waf-logs-errors/',
        compressionFormat: 'GZIP',
        encryptionConfiguration: {
          kmsEncryptionConfig: {
            awskmsKeyArn: wafLogsFirehoseKey.attrArn
          },
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: `/aws/waf/${props.stageName}`,
          logStreamName: 'waf-logs',
        }
      },
    });

    // IP Set for allowlist
    const allowedIPs = new wafv2.CfnIPSet(this, 'AllowedIPs', {
      name: `rcm-allowed-ips-${props.stageName}`,
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: props.stageName === 'prod' ? [] : ['127.0.0.1/32'], // Placeholder for staging, add real IPs in prod
    });

    // Rate limit rule
    const rateLimitRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'RateLimitRule',
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: props.stageName === 'prod' ? 2000 : 100,
          aggregateKeyType: 'IP',
        },
      },
      action: {
        block: {
          customResponse: {
            responseCode: 429,
            customResponseBodyKey: 'rateLimitExceeded',
          },
        },
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'RateLimitRule',
      },
    };

    // Geo-blocking rule (block high-risk countries)
    const geoBlockRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'GeoBlockingRule',
      priority: 2,
      statement: {
        geoMatchStatement: {
          countryCodes: ['CN', 'RU', 'KP'], // Add countries as needed
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'GeoBlockingRule',
      },
    };

    // SQL Injection protection
    const sqliRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'SQLiRule',
      priority: 3,
      statement: {
        orStatement: {
          statements: [
            {
              sqliMatchStatement: {
                fieldToMatch: { body: { oversizeHandling: 'MATCH' } },
                textTransformations: [{
                  priority: 0,
                  type: 'URL_DECODE',
                }, {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                }],
              },
            },
            {
              sqliMatchStatement: {
                fieldToMatch: { queryString: {} },
                textTransformations: [{
                  priority: 0,
                  type: 'URL_DECODE',
                }],
              },
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SQLiRule',
      },
    };

    // XSS protection
    const xssRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'XSSRule',
      priority: 4,
      statement: {
        xssMatchStatement: {
          fieldToMatch: { body: { oversizeHandling: 'MATCH' } },
          textTransformations: [{
            priority: 0,
            type: 'URL_DECODE',
          }, {
            priority: 1,
            type: 'HTML_ENTITY_DECODE',
          }],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'XSSRule',
      },
    };

    // Healthcare-specific data protection rule
    const healthcareDataProtectionRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'HealthcareDataProtectionRule',
      priority: 5,
      statement: {
        orStatement: {
          statements: [
            {
              regexMatchStatement: {
                fieldToMatch: { body: { oversizeHandling: 'MATCH' } },
                regexString: '\\b\\d{3}-\\d{2}-\\d{4}\\b|\\bMRN[0-9]{6,10}\\b', // SSN and MRN patterns
                textTransformations: [{
                  priority: 0,
                  type: 'LOWERCASE',
                }],
              },
            },
            {
              regexMatchStatement: {
                fieldToMatch: { queryString: {} },
                regexString: '\\b(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\\d{4}\\b', // DOB patterns
                textTransformations: [{
                  priority: 0,
                  type: 'URL_DECODE',
                }],
              },
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'HealthcareDataProtectionRule',
      },
    };

    // Size constraint rule (prevent large payloads)
    const sizeConstraintRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'SizeConstraintRule',
      priority: 6,
      statement: {
        sizeConstraintStatement: {
          fieldToMatch: { body: { oversizeHandling: 'MATCH' } },
          comparisonOperator: 'GT',
          size: 8192, // 8KB max body size
          textTransformations: [{
            priority: 0,
            type: 'NONE',
          }],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SizeConstraintRule',
      },
    };

    // AWS Managed Rules
    const awsManagedRulesCommonRuleSet: wafv2.CfnWebACL.RuleProperty = {
      name: 'AWS-AWSManagedRulesCommonRuleSet',
      priority: 10,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesCommonRuleSet',
          excludedRules: props.stageName === 'staging' ? [{ name: 'SizeRestrictions_BODY' }] : [],
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWSManagedRulesCommonRuleSet',
      },
    };

    const awsManagedRulesKnownBadInputsRuleSet: wafv2.CfnWebACL.RuleProperty = {
      name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
      priority: 11,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
      },
    };

    // Custom response bodies
    const customResponseBodies = {
      rateLimitExceeded: {
        contentType: 'APPLICATION_JSON',
        content: JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        }),
      },
    };

    // Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      name: `rcm-web-acl-${props.stageName}`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rules: [
        rateLimitRule,
        geoBlockRule,
        sqliRule,
        xssRule,
        healthcareDataProtectionRule,
        sizeConstraintRule,
        awsManagedRulesCommonRuleSet,
        awsManagedRulesKnownBadInputsRuleSet,
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `rcm-web-acl-${props.stageName}`,
      },
      customResponseBodies,
    });

    // Configure WAF logging
    const wafLogging = new wafv2.CfnLoggingConfiguration(this, 'WAFLogging', {
      resourceArn: webAcl.attrArn,
      logDestinationConfigs: [wafLogsFirehose.attrArn],
      loggingFilter: {
        DefaultBehavior: 'KEEP',
        Filters: [{
          Behavior: 'KEEP',
          Conditions: [{
            ActionCondition: {
              Action: 'BLOCK',
            },
          }],
          Requirement: 'MEETS_ANY',
        }],
      },
    });

    // HIPAA-Compliant Credential Management Infrastructure

    // KMS Key for encrypting external service credentials
    const credentialEncryptionKey = new kms.Key(this, 'CredentialEncryptionKey', {
      description: `KMS key for encrypting external service credentials - ${props.stageName}`,
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account to manage the key
          new iam.PolicyStatement({
            sid: 'EnableRootPermissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow application roles to use the key for encryption/decryption
          new iam.PolicyStatement({
            sid: 'AllowApplicationAccess',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('lambda.amazonaws.com'),
              new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            ],
            actions: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': [
                  `secretsmanager.${this.region}.amazonaws.com`,
                ],
              },
            },
          }),
          // Allow CloudWatch Logs to use the key for log group encryption
          new iam.PolicyStatement({
            sid: 'AllowCloudWatchLogsAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`)],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/rcm/${props.stageName}/credential-operations`,
              },
            },
          }),
        ],
      }),
    });

    // Alias for the KMS key
    new kms.Alias(this, 'CredentialEncryptionKeyAlias', {
      aliasName: `alias/rcm-credential-encryption-${props.stageName}`,
      targetKey: credentialEncryptionKey,
    });

    // IAM Role for Credential Management Lambda Functions
    const credentialManagementRole = new iam.Role(this, 'CredentialManagementRole', {
      roleName: `RCM-CredentialManagement-${props.stageName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      ),
      description: 'Role for managing external service credentials',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant the role access to manage secrets
    credentialManagementRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:CreateSecret',
        'secretsmanager:UpdateSecret',
        'secretsmanager:GetSecretValue',
        'secretsmanager:DeleteSecret',
        'secretsmanager:DescribeSecret',
        'secretsmanager:ListSecrets',
        'secretsmanager:TagResource',
        'secretsmanager:UntagResource',
        'secretsmanager:RestoreSecret',
      ],
      resources: [
        `arn:aws:secretsmanager:${this.region}:${this.account}:secret:rcm/${props.stageName}/credentials/*`,
      ],
    }));

    // Grant the role access to use the KMS key
    credentialEncryptionKey.grantDecrypt(credentialManagementRole);
    credentialEncryptionKey.grantEncrypt(credentialManagementRole);

    // CloudWatch Log Group for credential operations (HIPAA audit trail)
    const credentialAuditLogGroup = new logs.LogGroup(this, 'CredentialAuditLogGroup', {
      logGroupName: `/aws/rcm/${props.stageName}/credential-operations`,
      retention: logs.RetentionDays.TEN_YEARS, // HIPAA requires long retention
      encryptionKey: credentialEncryptionKey,
    });

    // Ensure KMS key is created before the log group
    credentialAuditLogGroup.node.addDependency(credentialEncryptionKey);

    // Grant the credential management role access to write to audit logs
    credentialAuditLogGroup.grantWrite(credentialManagementRole);

    // ============================================================================
    // TWILIO SMS ENCRYPTION SECRET
    // ============================================================================

    // Generate a cryptographically secure 256-bit encryption key for Twilio SMS
    const twilioEncryptionKey = randomBytes(32).toString('base64');

    // Twilio SMS Encryption Secret
    const twilioEncryptionSecret = new secretsmanager.Secret(this, 'TwilioEncryptionSecret', {
      secretName: `foresight-cdss/twilio-encryption-key`,
      description: 'Encryption key for Twilio SMS OTP codes - HIPAA compliant',
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        encryptionKey: twilioEncryptionKey,
        createdAt: new Date().toISOString(),
        purpose: 'twilio-sms-otp-encryption',
        keyVersion: 'v1',
        stage: props.stageName
      })),
      encryptionKey: credentialEncryptionKey,
    });

    // Add tags for compliance and management
    cdk.Tags.of(twilioEncryptionSecret).add('Service', 'foresight-cdss');
    cdk.Tags.of(twilioEncryptionSecret).add('Purpose', 'twilio-encryption');
    cdk.Tags.of(twilioEncryptionSecret).add('Environment', props.stageName);
    cdk.Tags.of(twilioEncryptionSecret).add('Compliance', 'HIPAA');
    cdk.Tags.of(twilioEncryptionSecret).add('DataClassification', 'Sensitive');

    // Grant the credential management role access to the Twilio secret
    twilioEncryptionSecret.grantRead(credentialManagementRole);
    twilioEncryptionSecret.grantWrite(credentialManagementRole);

    // Update the credential management role permissions to include Twilio secrets
    credentialManagementRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
      resources: [twilioEncryptionSecret.secretArn],
      conditions: {
        StringEquals: {
          'secretsmanager:ResourceTag/Service': 'foresight-cdss',
          'secretsmanager:ResourceTag/Purpose': 'twilio-encryption',
        },
      },
    }));

    // CloudWatch Log Group specifically for Twilio SMS operations
    const twilioAuditLogGroup = new logs.LogGroup(this, 'TwilioSMSAuditLogGroup', {
      logGroupName: `/aws/rcm/${props.stageName}/twilio-sms-operations`,
      retention: logs.RetentionDays.TEN_YEARS, // HIPAA requires long retention
      encryptionKey: credentialEncryptionKey,
    });

    // Grant access to write Twilio SMS audit logs
    twilioAuditLogGroup.grantWrite(credentialManagementRole);

    // Assign class properties for external access
    this.credentialEncryptionKey = credentialEncryptionKey;
    this.credentialManagementRole = credentialManagementRole;
    this.credentialAuditLogGroup = credentialAuditLogGroup;

    // CloudWatch Dashboard for credential management monitoring
    const credentialDashboard = new cdk.aws_cloudwatch.Dashboard(this, 'CredentialManagementDashboard', {
      dashboardName: `rcm-credentials-${props.stageName}`,
    });

    credentialDashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Credential Operations',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Logs',
            metricName: 'IncomingLogEvents',
            dimensionsMap: {
              LogGroupName: credentialAuditLogGroup.logGroupName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Twilio SMS Operations',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Logs',
            metricName: 'IncomingLogEvents',
            dimensionsMap: {
              LogGroupName: twilioAuditLogGroup.logGroupName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cdk.aws_cloudwatch.SingleValueWidget({
        title: 'Active Credentials',
        metrics: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/SecretsManager',
            metricName: 'SuccessfulRequestLatency',
            statistic: 'SampleCount',
            period: cdk.Duration.hours(24),
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cdk.aws_cloudwatch.SingleValueWidget({
        title: 'Twilio Secret Access',
        metrics: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/SecretsManager',
            metricName: 'SuccessfulRequestLatency',
            dimensionsMap: {
              SecretName: twilioEncryptionSecret.secretName,
            },
            statistic: 'SampleCount',
            period: cdk.Duration.hours(24),
          }),
        ],
        width: 6,
        height: 6,
      }),
    );

    // TODO: Associate WAF with API Gateway - currently disabled due to ARN format issues
    // The correct ARN format for HTTP API Gateway v2 is proving difficult to determine
    // This can be associated manually in the AWS console if needed
    // new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
    //   resourceArn: `arn:aws:apigateway:${this.region}::/apis/${props.api.httpApiId}/stages/${props.api.defaultStage?.stageName || 'default'}`,
    //   webAclArn: webAcl.attrArn,
    // });

    // CloudWatch Dashboard for WAF metrics
    const wafDashboard = new cdk.aws_cloudwatch.Dashboard(this, 'WAFDashboard', {
      dashboardName: `rcm-waf-${props.stageName}`,
    });

    wafDashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'WAF Blocked Requests',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensionsMap: {
              WebACL: webAcl.name!,
              Region: this.region,
              Rule: 'ALL',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'WAF Allowed Requests',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'AllowedRequests',
            dimensionsMap: {
              WebACL: webAcl.name!,
              Region: this.region,
              Rule: 'ALL',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // GitHub Actions OIDC Identity Provider (only create once per account)
    let githubOidcProvider: iam.IOpenIdConnectProvider;

    if (props.stageName === 'staging') {
      githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1', '1c58a3a8518e8759bf075b76b750d4f2df264fcd'],
      });
    } else {
      // Reference existing provider for prod
      githubOidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        'GitHubOIDCProvider',
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
      );
    }

    // IAM Role for GitHub Actions
    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: `RCM-GitHubActions-${props.stageName}`,
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': 'repo:foresight-industries/foresight-cdss-next:*',
        },
      }),
      description: 'Role for GitHub Actions to deploy CDK infrastructure',
      maxSessionDuration: cdk.Duration.hours(2),
    });

    // Attach necessary policies for CDK deployment
    githubActionsRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
    );

    // Additional IAM permissions for CDK bootstrapping and deployment
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'iam:*',
        'organizations:DescribeOrganization',
        'account:GetContactInformation',
        'account:GetAlternateContact',
        'account:GetAccountInformation',
      ],
      resources: ['*'],
    }));

    // Output WAF ACL ID
    new cdk.CfnOutput(this, 'WebACLId', {
      value: webAcl.attrId,
      exportName: `RCM-WebACLId-${props.stageName}`,
    });

    // Output GitHub Actions Role ARN
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: githubActionsRole.roleArn,
      exportName: `RCM-GitHubActionsRoleArn-${props.stageName}`,
      description: 'ARN of the IAM role for GitHub Actions',
    });

    // Output GitHub OIDC Provider ARN
    new cdk.CfnOutput(this, 'GitHubOIDCProviderArn', {
      value: githubOidcProvider.openIdConnectProviderArn,
      exportName: `RCM-GitHubOIDCProviderArn-${props.stageName}`,
      description: 'ARN of the GitHub OIDC provider',
    });

    // Output Credential Management Infrastructure
    new cdk.CfnOutput(this, 'CredentialEncryptionKeyId', {
      value: credentialEncryptionKey.keyId,
      exportName: `RCM-CredentialEncryptionKeyId-${props.stageName}`,
      description: 'ID of the KMS key for credential encryption',
    });

    new cdk.CfnOutput(this, 'CredentialEncryptionKeyArn', {
      value: credentialEncryptionKey.keyArn,
      exportName: `RCM-CredentialEncryptionKeyArn-${props.stageName}`,
      description: 'ARN of the KMS key for credential encryption',
    });

    new cdk.CfnOutput(this, 'CredentialManagementRoleArn', {
      value: credentialManagementRole.roleArn,
      exportName: `RCM-CredentialManagementRoleArn-${props.stageName}`,
      description: 'ARN of the IAM role for credential management',
    });

    new cdk.CfnOutput(this, 'CredentialAuditLogGroupArn', {
      value: credentialAuditLogGroup.logGroupArn,
      exportName: `RCM-CredentialAuditLogGroupArn-${props.stageName}`,
      description: 'ARN of the CloudWatch log group for credential audit trail',
    });

    // Output Twilio SMS Infrastructure
    new cdk.CfnOutput(this, 'TwilioEncryptionSecretArn', {
      value: twilioEncryptionSecret.secretArn,
      exportName: `RCM-TwilioEncryptionSecretArn-${props.stageName}`,
      description: 'ARN of the Twilio SMS encryption secret',
    });

    new cdk.CfnOutput(this, 'TwilioEncryptionSecretName', {
      value: twilioEncryptionSecret.secretName,
      exportName: `RCM-TwilioEncryptionSecretName-${props.stageName}`,
      description: 'Name of the Twilio SMS encryption secret',
    });

    new cdk.CfnOutput(this, 'TwilioAuditLogGroupArn', {
      value: twilioAuditLogGroup.logGroupArn,
      exportName: `RCM-TwilioAuditLogGroupArn-${props.stageName}`,
      description: 'ARN of the CloudWatch log group for Twilio SMS audit trail',
    });
  }
}

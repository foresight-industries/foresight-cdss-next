import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  stageName: string;
  api: apigateway.HttpApi;
}

export class SecurityStack extends cdk.Stack {
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
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Kinesis Firehose for WAF logging
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    wafLogsBucket.grantWrite(firehoseRole);

    const wafLogsFirehose = new kinesisfirehose.CfnDeliveryStream(this, 'WAFLogsFirehose', {
      deliveryStreamName: `aws-waf-logs-rcm-${props.stageName}`,
      deliveryStreamType: 'DirectPut',
      s3DestinationConfiguration: {
        bucketArn: wafLogsBucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        prefix: 'waf-logs/',
        errorOutputPrefix: 'waf-logs-errors/',
        compressionFormat: 'GZIP',
      },
    });

    // IP Set for allowlist
    const allowedIPs = new wafv2.CfnIPSet(this, 'AllowedIPs', {
      name: `rcm-allowed-ips-${props.stageName}`,
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: props.stageName === 'prod' ? [] : ['0.0.0.0/0'], // Add your office IPs in prod
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

    // Geo blocking rule (block high-risk countries)
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

    // Size constraint rule (prevent large payloads)
    const sizeConstraintRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'SizeConstraintRule',
      priority: 5,
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
        defaultBehavior: 'KEEP',
        filters: [{
          behavior: 'KEEP',
          conditions: [{
            actionCondition: {
              action: 'BLOCK',
            },
          }],
          requirement: 'MEETS_ANY',
        }],
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${props.api.httpApiId}/stages/$default`,
      webAclArn: webAcl.attrArn,
    });

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

    // Output WAF ACL ID
    new cdk.CfnOutput(this, 'WebACLId', {
      value: webAcl.attrId,
      exportName: `RCM-WebACLId-${props.stageName}`,
    });
  }
}

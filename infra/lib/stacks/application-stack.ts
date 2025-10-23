import * as cdk from 'aws-cdk-lib';
import * as resourcegroups from 'aws-cdk-lib/aws-resourcegroups';
import { Construct } from 'constructs';

interface ApplicationStackProps extends cdk.StackProps {
  stageName: string;
}

export class ApplicationStack extends cdk.Stack {
  public readonly applicationArn: string;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    // Create Application using Resource Groups (simpler approach)
    // The Resource Groups below will provide the application organization
    this.applicationArn = `arn:aws:resource-groups:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:group/foresight-rcm-resources-${props.stageName}`;

    // Create Resource Group for all RCM resources
    new resourcegroups.CfnGroup(this, 'ForesightRCMResourceGroup', {
      name: `foresight-rcm-resources-${props.stageName}`,
      description: `All AWS resources for Foresight ${props.stageName} environment`,
      resourceQuery: {
        type: 'TAG_FILTERS_1_0',
        query: {
          resourceTypeFilters: ['AWS::AllSupported'],
          tagFilters: [
            {
              key: 'Project',
              values: ['ForesightRCM'],
            },
            {
              key: 'Environment',
              values: [props.stageName],
            },
          ],
        },
      },
      tags: [
        {
          key: 'Project',
          value: 'ForesightRCM',
        },
        {
          key: 'Environment',
          value: props.stageName,
        },
      ],
    });

    // Create component resource groups for major subsystems
    const components = [
      { name: 'database', description: 'Aurora PostgreSQL cluster and related resources' },
      { name: 'storage', description: 'S3 buckets for documents and data storage' },
      { name: 'compute', description: 'Lambda functions and Batch processing' },
      { name: 'cache', description: 'ElastiCache Redis for session and data caching' },
      { name: 'api', description: 'AppSync GraphQL API and resolvers' },
      { name: 'monitoring', description: 'CloudWatch CloudTrail and observability resources' },
      { name: 'security', description: 'IAM roles KMS keys and security resources' },
    ];

    for (const component of components) {
      new resourcegroups.CfnGroup(this, `${component.name}ComponentGroup`, {
        name: `foresight-rcm-${component.name}-${props.stageName}`,
        description: component.description,
        resourceQuery: {
          type: 'TAG_FILTERS_1_0',
          query: {
            resourceTypeFilters: ['AWS::AllSupported'],
            tagFilters: [
              {
                key: 'Project',
                values: ['ForesightRCM'],
              },
              {
                key: 'Environment',
                values: [props.stageName],
              },
              {
                key: 'Component',
                values: [component.name],
              },
            ],
          },
        },
        tags: [
          {
            key: 'Project',
            value: 'ForesightRCM',
          },
          {
            key: 'Environment',
            value: props.stageName,
          },
          {
            key: 'Component',
            value: component.name,
          },
        ],
      });
    }

    // Add AWS Systems Manager Application Manager cost tracking tags
    cdk.Tags.of(this).add('AppManagerCFNStackKey', `foresight-rcm-${props.stageName}`);
    cdk.Tags.of(this).add('Project', 'ForesightRCM');
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Component', 'application');

    // Outputs
    new cdk.CfnOutput(this, 'ApplicationArn', {
      value: this.applicationArn,
      description: 'Systems Manager Application ARN',
      exportName: `Foresight-Application-Arn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'ResourceGroupName', {
      value: `foresight-rcm-resources-${props.stageName}`,
      description: 'Resource Group name for all RCM resources',
      exportName: `Foresight-ResourceGroup-${props.stageName}`,
    });
  }
}

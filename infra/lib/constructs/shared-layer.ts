import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'node:path';
import type { Construct } from 'constructs';

export interface SharedLayerProps {
  stageName: string;
}

export class SharedLayer extends Construct {
  public readonly layer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: SharedLayerProps) {
    super(scope, id);

    // Create the shared dependencies layer
    this.layer = new lambda.LayerVersion(this, 'RCMSharedLayer', {
      layerVersionName: `rcm-shared-dependencies-${props.stageName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../layers/dependencies')),
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_18_X,
        lambda.Runtime.NODEJS_20_X,
        lambda.Runtime.NODEJS_22_X,
      ],
      description: `Shared dependencies for RCM Lambda functions - ${props.stageName}`,
      removalPolicy: props.stageName === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Tag the layer for compliance
    cdk.Tags.of(this.layer).add('Environment', props.stageName);
    cdk.Tags.of(this.layer).add('Purpose', 'SharedDependencies');
    cdk.Tags.of(this.layer).add('HealthcareCompliance', 'HIPAA');
  }
}

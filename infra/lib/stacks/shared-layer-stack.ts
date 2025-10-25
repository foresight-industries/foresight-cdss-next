import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { SharedLayer } from '../constructs/shared-layer';

export interface SharedLayerStackProps extends cdk.StackProps {
  stageName: string;
}

export class SharedLayerStack extends cdk.Stack {
  public readonly sharedLayer: SharedLayer;

  constructor(scope: Construct, id: string, props: SharedLayerStackProps) {
    super(scope, id, props);

    // Create the shared layer
    this.sharedLayer = new SharedLayer(this, 'SharedLayer', {
      stageName: props.stageName,
    });

    // Output for other stacks to reference
    new cdk.CfnOutput(this, 'SharedLayerArn', {
      value: this.sharedLayer.layer.layerVersionArn,
      exportName: `RCM-SharedLayer-${props.stageName}`,
      description: 'ARN of the shared dependencies layer',
    });

    // Tag the stack for compliance
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Purpose', 'SharedDependencies');
    cdk.Tags.of(this).add('HealthcareCompliance', 'HIPAA');
  }
}

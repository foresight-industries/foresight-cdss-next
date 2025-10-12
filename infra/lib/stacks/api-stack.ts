import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayIntegrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as apigatewayAuthorizers from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  stageName: string;
  database: rds.DatabaseCluster;
  documentssBucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset('layers/dependencies'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies for Lambda functions',
    });

    // Base Lambda function props
    const functionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        DOCUMENTS_BUCKET: props.documentssBucket.bucketName,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
      },
      layers: [dependenciesLayer],
      tracing: lambda.Tracing.ACTIVE,
    };

    // Clerk authorizer Lambda
    const authorizerFn = new lambda.Function(this, 'ClerkAuthorizer', {
      ...functionProps,
      functionName: `rcm-clerk-authorizer-${props.stageName}`,
      handler: 'authorizer.handler',
      code: lambda.Code.fromAsset('packages/functions/auth', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'npm ci && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
    });

    // Create HTTP API with Clerk authorizer
    const authorizer = new apigatewayAuthorizers.HttpLambdaAuthorizer(
      'ClerkAuthorizer',
      authorizerFn,
      {
        responseTypes: [apigatewayAuthorizers.HttpLambdaResponseType.SIMPLE],
        identitySource: ['$request.header.Authorization'],
        resultsCacheTtl: cdk.Duration.minutes(5),
      }
    );

    this.httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `rcm-api-${props.stageName}`,
      corsPreflight: {
        allowOrigins: props.stageName === 'prod'
          ? ['https://yourdomain.com']
          : ['http://localhost:3000', 'https://*.vercel.app'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
        allowCredentials: true,
      },
      defaultAuthorizer: authorizer,
    });

    // Patient API Lambda
    const patientsFn = new lambda.Function(this, 'PatientsFunction', {
      ...functionProps,
      functionName: `rcm-patients-${props.stageName}`,
      handler: 'patients.handler',
      code: lambda.Code.fromAsset('packages/functions/api', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'npm ci && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
    });

    // Grant permissions
    props.database.grantDataApiAccess(patientsFn);
    props.documentssBucket.grantReadWrite(patientsFn);

    // Add routes
    this.httpApi.addRoutes({
      path: '/patients',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'PatientsIntegration',
        patientsFn
      ),
    });

    // Claims API Lambda
    const claimsFn = new lambda.Function(this, 'ClaimsFunction', {
      ...functionProps,
      functionName: `rcm-claims-${props.stageName}`,
      handler: 'claims.handler',
      code: lambda.Code.fromAsset('packages/functions/api', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'npm ci && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
    });

    props.database.grantDataApiAccess(claimsFn);
    props.documentssBucket.grantReadWrite(claimsFn);

    this.httpApi.addRoutes({
      path: '/claims',
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ClaimsIntegration',
        claimsFn
      ),
    });

    // Presigned URL Lambda (for S3 uploads)
    const presignFn = new lambda.Function(this, 'PresignFunction', {
      ...functionProps,
      functionName: `rcm-presign-${props.stageName}`,
      handler: 'presign.handler',
      code: lambda.Code.fromAsset('packages/functions/api', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', '-c', 'npm ci && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
    });

    props.documentssBucket.grantPut(presignFn);
    props.documentssBucket.grantRead(presignFn);

    this.httpApi.addRoutes({
      path: '/documents/presign',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'PresignIntegration',
        presignFn
      ),
    });

    // Output API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      exportName: `RCM-ApiEndpoint-${props.stageName}`,
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  stageName: string;
  database: rds.DatabaseCluster;
  documentsBucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset('./layers/dependencies'),
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
        DOCUMENTS_BUCKET: props.documentsBucket.bucketName,
      },
      layers: [dependenciesLayer],
      tracing: lambda.Tracing.ACTIVE,
    };

    const clerkSecret = secretsManager.Secret.fromSecretNameV2(this, 'ClerkSecret', `rcm-clerk-secret-${props.stageName}`);

    // Clerk authorizer Lambda
    const authorizerFn = new lambda.Function(this, 'ClerkAuthorizer', {
      ...functionProps,
      functionName: `rcm-clerk-authorizer-${props.stageName}`,
      handler: 'clerk-authorizer.handler',
      code: lambda.Code.fromAsset('../packages/functions/auth'),
      environment: {
        ...functionProps.environment,
        CLERK_SECRET_ARN: clerkSecret.secretArn,
      },
    });

    // Grant read access to Clerk secret
    clerkSecret.grantRead(authorizerFn);

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
          ? ['https://have-foresight.app', 'https://foresight-cdss-next.vercel.app']
          : ['http://localhost:3000', 'https://localhost:3001'],
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
      handler: 'patients-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
    });

    // Grant permissions
    props.database.grantDataApiAccess(patientsFn);
    props.documentsBucket.grantReadWrite(patientsFn);

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
      handler: 'claims-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
    });

    props.database.grantDataApiAccess(claimsFn);
    props.documentsBucket.grantReadWrite(claimsFn);

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
      handler: 'presign-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
    });

    props.documentsBucket.grantPut(presignFn);
    props.documentsBucket.grantRead(presignFn);

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

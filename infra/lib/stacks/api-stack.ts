import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { CacheStack } from './cache-stack';
import { MedicalDataStack } from './medical-data-stack';

interface ApiStackProps extends cdk.StackProps {
  stageName: string;
  database: rds.DatabaseCluster;
  documentsBucket: s3.Bucket;
  cacheStack: CacheStack;
  medicalDataStack: MedicalDataStack;
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

    // Get cache and medical data configuration from stacks
    const redisUrl = props.cacheStack.redisConnectionStringSecret.secretValue.unsafeUnwrap();
    const medicalCodesBucket = props.medicalDataStack.medicalCodesBucket.bucketName;

    // Base Lambda function props with explicit role to avoid cross-environment issues
    const createFunctionRole = (name: string) => new cdk.aws_iam.Role(this, `${name}Role`, {
      roleName: `rcm-${name.toLowerCase()}-role-${props.stageName}`,
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

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
        // Cache configuration
        REDIS_URL: redisUrl,
        CACHE_DEFAULT_TTL: '3600',
        CACHE_HOT_CODES_TTL: '7200',
        // Medical data configuration
        MEDICAL_CODES_BUCKET: medicalCodesBucket,
      },
      layers: [dependenciesLayer],
      tracing: lambda.Tracing.ACTIVE,
    };

    const clerkSecret = secretsManager.Secret.fromSecretNameV2(this, 'ClerkSecret', `rcm-clerk-secret-${props.stageName}`);

    // Clerk authorizer Lambda
    const authorizerRole = createFunctionRole('ClerkAuthorizer');
    const authorizerFn = new lambda.Function(this, 'ClerkAuthorizer', {
      ...functionProps,
      functionName: `rcm-clerk-authorizer-${props.stageName}`,
      handler: 'clerk-authorizer.handler',
      code: lambda.Code.fromAsset('../packages/functions/auth'),
      role: authorizerRole,
      environment: {
        ...functionProps.environment,
        CLERK_SECRET_ARN: clerkSecret.secretArn,
      },
    });

    // Grant read access to Clerk secret
    authorizerRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [clerkSecret.secretArn],
    }));

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
    const patientsRole = createFunctionRole('PatientsFunction');
    const patientsFn = new lambda.Function(this, 'PatientsFunction', {
      ...functionProps,
      functionName: `rcm-patients-${props.stageName}`,
      handler: 'patients-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
      role: patientsRole,
    });

    // Grant permissions via IAM policies to avoid cross-stack issues
    patientsRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [props.database.clusterArn],
    }));
    patientsRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [props.documentsBucket.bucketArn, `${props.documentsBucket.bucketArn}/*`],
    }));

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
    const claimsRole = createFunctionRole('ClaimsFunction');
    const claimsFn = new lambda.Function(this, 'ClaimsFunction', {
      ...functionProps,
      functionName: `rcm-claims-${props.stageName}`,
      handler: 'claims-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
      role: claimsRole,
    });

    claimsRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [props.database.clusterArn],
    }));
    claimsRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [props.documentsBucket.bucketArn, `${props.documentsBucket.bucketArn}/*`],
    }));

    this.httpApi.addRoutes({
      path: '/claims',
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ClaimsIntegration',
        claimsFn
      ),
    });

    // Presigned URL Lambda (for S3 uploads)
    const presignRole = createFunctionRole('PresignFunction');
    const presignFn = new lambda.Function(this, 'PresignFunction', {
      ...functionProps,
      functionName: `rcm-presign-${props.stageName}`,
      handler: 'presign-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
      role: presignRole,
    });

    presignRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
      resources: [props.documentsBucket.bucketArn, `${props.documentsBucket.bucketArn}/*`],
    }));

    this.httpApi.addRoutes({
      path: '/documents/presign',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'PresignIntegration',
        presignFn
      ),
    });

    // Medical Code Processing Lambda (for annual updates)
    const medicalCodesRole = createFunctionRole('MedicalCodesFunction');
    const medicalCodesFn = new lambda.Function(this, 'MedicalCodesFunction', {
      ...functionProps,
      functionName: `rcm-medical-codes-${props.stageName}`,
      handler: 'medical-codes-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
      timeout: cdk.Duration.minutes(15), // Longer timeout for code processing
      memorySize: 1024, // More memory for processing large datasets
      role: medicalCodesRole,
      environment: {
        ...functionProps.environment,
        MEDICAL_CODES_BACKUP_BUCKET: props.medicalDataStack.medicalCodesBackupBucket.bucketName,
      },
    });

    // Grant comprehensive permissions to medical codes function via IAM policies
    medicalCodesRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [props.database.clusterArn],
    }));

    medicalCodesRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [
        props.medicalDataStack.medicalCodesBucket.bucketArn,
        `${props.medicalDataStack.medicalCodesBucket.bucketArn}/*`,
        props.medicalDataStack.medicalCodesBackupBucket.bucketArn,
        `${props.medicalDataStack.medicalCodesBackupBucket.bucketArn}/*`,
      ],
    }));

    medicalCodesRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [props.cacheStack.redisConnectionStringSecret.secretArn],
    }));

    // Add medical codes API routes
    this.httpApi.addRoutes({
      path: '/medical-codes',
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'MedicalCodesIntegration',
        medicalCodesFn
      ),
    });

    // Grant common permissions to all function roles
    const allRoles = [patientsRole, claimsRole, presignRole, authorizerRole];

    for (const role of allRoles) {
      // Grant cache access
      role.addToPolicy(new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.cacheStack.redisConnectionStringSecret.secretArn],
      }));

      // Grant SSM parameter access for cache configuration
      role.addToPolicy(new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/foresight/${props.stageName}/cache/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/foresight/${props.stageName}/storage/*`,
        ],
      }));

      // Grant medical codes bucket read access (for code lookups)
      role.addToPolicy(new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          props.medicalDataStack.medicalCodesBucket.bucketArn,
          `${props.medicalDataStack.medicalCodesBucket.bucketArn}/*`,
        ],
      }));
    }

    // Output API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      exportName: `RCM-ApiEndpoint-${props.stageName}`,
    });
  }
}

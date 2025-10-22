import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'node:path';

interface AppConfigStackProps extends cdk.StackProps {
  stageName: string;
}

export class AppConfigStack extends cdk.Stack {
  public readonly application: appconfig.CfnApplication;
  public readonly appConfigEnvironment: appconfig.CfnEnvironment;
  public readonly configurationProfile: appconfig.CfnConfigurationProfile;
  public readonly featureFlagsProfile: appconfig.CfnConfigurationProfile;
  public readonly retrievalRole: iam.Role;
  public readonly retrievalLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: AppConfigStackProps) {
    super(scope, id, props);

    // Create AppConfig Application
    this.application = new appconfig.CfnApplication(this, 'HealthcareRCMApp', {
      name: `foresight-rcm-${props.stageName}`,
      description: `Healthcare RCM feature flags and configuration for ${props.stageName}`,
      tags: [
        {
          key: 'Environment',
          value: props.stageName,
        },
        {
          key: 'Project',
          value: 'ForesightRCM',
        },
      ],
    });

    // Create Environment
    this.appConfigEnvironment = new appconfig.CfnEnvironment(this, 'HealthcareRCMEnvironment', {
      applicationId: this.application.ref,
      name: `${props.stageName}`,
      description: `${props.stageName} environment for healthcare RCM`,
      tags: [
        {
          key: 'Environment',
          value: props.stageName,
        },
      ],
    });

    // Create Configuration Profile for general app settings
    this.configurationProfile = new appconfig.CfnConfigurationProfile(this, 'AppConfigurationProfile', {
      applicationId: this.application.ref,
      name: 'app-configuration',
      description: 'General application configuration settings',
      locationUri: 'hosted',
      type: 'AWS.Freeform',
      tags: [
        {
          key: 'Type',
          value: 'Configuration',
        },
      ],
    });

    // Create Feature Flags Configuration Profile
    this.featureFlagsProfile = new appconfig.CfnConfigurationProfile(this, 'FeatureFlagsProfile', {
      applicationId: this.application.ref,
      name: 'feature-flags',
      description: 'Healthcare RCM feature flags',
      locationUri: 'hosted',
      type: 'AWS.AppConfig.FeatureFlags',
      tags: [
        {
          key: 'Type',
          value: 'FeatureFlags',
        },
      ],
    });

    // Create initial feature flags configuration
    new appconfig.CfnHostedConfigurationVersion(this, 'InitialFeatureFlags', {
      applicationId: this.application.ref,
      configurationProfileId: this.featureFlagsProfile.ref,
      contentType: 'application/json',
      content: JSON.stringify({
        flags: {
          // UI/UX Feature Flags
          newDashboardUI: {
            name: 'newDashboardUI',
            description: 'Enable new dashboard user interface',
            enabled: props.stageName === 'prod' ? false : true, // Enable in staging first
          },
          darkModeSupport: {
            name: 'darkModeSupport',
            description: 'Enable dark mode toggle in UI',
            enabled: true,
          },
          advancedFiltering: {
            name: 'advancedFiltering',
            description: 'Enable advanced filtering options in tables',
            enabled: true,
          },

          // Healthcare-specific Feature Flags
          priorAuthWorkflow: {
            name: 'priorAuthWorkflow',
            description: 'Enable prior authorization workflow features',
            enabled: props.stageName === 'prod' ? true : true,
          },
          claimStatusRealtime: {
            name: 'claimStatusRealtime',
            description: 'Enable real-time claim status updates via AppSync',
            enabled: true,
          },
          bulkClaimProcessing: {
            name: 'bulkClaimProcessing',
            description: 'Enable bulk claim processing via AWS Batch',
            enabled: props.stageName === 'prod' ? true : false,
          },

          // Integration Feature Flags
          healthLakeIntegration: {
            name: 'healthLakeIntegration',
            description: 'Enable AWS HealthLake FHIR integration',
            enabled: false, // Disabled by default, enable when ready
          },
          comprehendMedical: {
            name: 'comprehendMedical',
            description: 'Enable AWS Comprehend Medical for document processing',
            enabled: props.stageName === 'prod' ? false : true,
          },

          // Performance Feature Flags
          elastiCacheCaching: {
            name: 'elastiCacheCaching',
            description: 'Enable ElastiCache for API response caching',
            enabled: true,
          },
          apiRateLimiting: {
            name: 'apiRateLimiting',
            description: 'Enable API rate limiting with Redis',
            enabled: props.stageName === 'prod' ? true : false,
          },

          // Experimental Features
          aiClaimReview: {
            name: 'aiClaimReview',
            description: 'Enable AI-powered claim review suggestions',
            enabled: false,
          },
          patientPortalV2: {
            name: 'patientPortalV2',
            description: 'Enable new patient portal interface',
            enabled: false,
          },
        },
        values: {
          // Feature flag values and configurations
          newDashboardUI: {
            enabled: props.stageName === 'prod' ? false : true,
            variant: 'modern', // 'classic' | 'modern' | 'minimal'
          },
          darkModeSupport: {
            enabled: true,
            defaultTheme: 'light', // 'light' | 'dark' | 'system'
          },
          advancedFiltering: {
            enabled: true,
            maxFilters: 10,
          },
          priorAuthWorkflow: {
            enabled: props.stageName === 'prod' ? true : true,
            autoApprovalThreshold: 1000, // Amount threshold for auto-approval
          },
          claimStatusRealtime: {
            enabled: true,
            pollingIntervalMs: 5000,
          },
          bulkClaimProcessing: {
            enabled: props.stageName === 'prod' ? true : false,
            batchSize: 100,
          },
          healthLakeIntegration: {
            enabled: false,
            endpoint: '', // Will be configured when enabled
          },
          comprehendMedical: {
            enabled: props.stageName === 'prod' ? false : true,
            confidenceThreshold: 0.8,
          },
          elastiCacheCaching: {
            enabled: true,
            defaultTtlSeconds: 300,
          },
          apiRateLimiting: {
            enabled: props.stageName === 'prod' ? true : false,
            requestsPerMinute: 100,
          },
          aiClaimReview: {
            enabled: false,
            modelVersion: 'v1',
          },
          patientPortalV2: {
            enabled: false,
            rolloutPercentage: 0,
          },
        },
        version: '1',
      }),
      description: 'Initial feature flags configuration',
    });

    // Create initial app configuration
    new appconfig.CfnHostedConfigurationVersion(this, 'InitialAppConfiguration', {
      applicationId: this.application.ref,
      configurationProfileId: this.configurationProfile.ref,
      contentType: 'application/json',
      content: JSON.stringify({
        ui: {
          appName: 'Foresight RCM',
          theme: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            accentColor: '#06b6d4',
          },
          pagination: {
            defaultPageSize: 25,
            pageSizeOptions: [10, 25, 50, 100],
          },
          notifications: {
            autoCloseDelay: 5000,
            maxNotifications: 5,
          },
        },
        api: {
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
        },
        healthcare: {
          claimSubmission: {
            autoSaveInterval: 30000,
            validationLevel: 'strict', // 'loose' | 'normal' | 'strict'
          },
          priorAuth: {
            reminderDays: [7, 3, 1], // Days before expiration to send reminders
            autoRenewalDays: 30,
          },
        },
        integrations: {
          redis: {
            sessionTimeout: 3600,
            cachePrefix: 'foresight:',
          },
          database: {
            connectionTimeout: 10000,
            queryTimeout: 30000,
          },
        },
      }),
      description: 'Initial application configuration',
    });

    // Create deployment strategy
    const deploymentStrategy = new appconfig.CfnDeploymentStrategy(this, 'FeatureFlagDeploymentStrategy', {
      name: `foresight-feature-flag-deployment-${props.stageName}`,
      description: 'Deployment strategy for feature flags with gradual rollout',
      deploymentDurationInMinutes: props.stageName === 'prod' ? 20 : 5, // Slower rollout in prod
      finalBakeTimeInMinutes: props.stageName === 'prod' ? 10 : 2,
      growthFactor: 20, // 20% increase each step
      growthType: 'LINEAR',
      replicateTo: 'NONE',
      tags: [
        {
          key: 'Type',
          value: 'FeatureFlag',
        },
      ],
    });

    // Create IAM role for AppConfig retrieval
    this.retrievalRole = new iam.Role(this, 'AppConfigRetrievalRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        AppConfigRetrievalPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'appconfig:GetApplication',
                'appconfig:GetEnvironment',
                'appconfig:GetConfigurationProfile',
                'appconfig:GetDeployment',
                'appconfig:GetConfiguration',
                'appconfig:StartConfigurationSession',
              ],
              resources: [
                `arn:aws:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/${this.application.ref}`,
                `arn:aws:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/${this.application.ref}/environment/${this.appConfigEnvironment.ref}`,
                `arn:aws:appconfig:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/${this.application.ref}/configurationprofile/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create Lambda function for AppConfig retrieval (for server-side usage)
    this.retrievalLambda = new lambdaNodejs.NodejsFunction(this, 'AppConfigRetrievalFunction', {
      functionName: `foresight-appconfig-retrieval-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: join(__dirname, '../lambda/appconfig-retrieval.ts'),
      role: this.retrievalRole,
      environment: {
        APPCONFIG_APPLICATION_ID: this.application.ref,
        APPCONFIG_ENVIRONMENT: props.stageName,
        APPCONFIG_FEATURE_FLAGS_PROFILE: this.featureFlagsProfile.ref,
        APPCONFIG_CONFIGURATION_PROFILE: this.configurationProfile.ref,
        STAGE_NAME: props.stageName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Outputs
    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: this.application.ref,
      description: 'AppConfig Application ID',
      exportName: `Foresight-AppConfig-Application-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'AppConfigEnvironmentId', {
      value: this.appConfigEnvironment.ref,
      description: 'AppConfig Environment ID',
      exportName: `Foresight-AppConfig-Environment-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'FeatureFlagsProfileId', {
      value: this.featureFlagsProfile.ref,
      description: 'Feature Flags Configuration Profile ID',
      exportName: `Foresight-AppConfig-FeatureFlags-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'AppConfigurationProfileId', {
      value: this.configurationProfile.ref,
      description: 'App Configuration Profile ID',
      exportName: `Foresight-AppConfig-Configuration-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'AppConfigRetrievalLambdaArn', {
      value: this.retrievalLambda.functionArn,
      description: 'AppConfig Retrieval Lambda Function ARN',
      exportName: `Foresight-AppConfig-Lambda-${props.stageName}`,
    });
  }
}

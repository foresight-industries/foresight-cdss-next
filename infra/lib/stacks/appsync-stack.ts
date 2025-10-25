import * as cdk from 'aws-cdk-lib';
import { Duration, Expiration } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import {
  AmplifyGraphqlApi,
  AmplifyGraphqlDefinition,
} from '@aws-amplify/graphql-api-construct';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import { join } from 'node:path';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { AppSyncAuthorizationType } from 'aws-cdk-lib/aws-appsync';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

if (!process.env.APPSYNC_CERT_ARN) {
  throw new Error('Missing APPSYNC_CERT_ARN environment variable');
}

if (!process.env.EVENTS_CERT_ARN) {
  throw new Error('Missing EVENTS_CERT_ARN environment variable');
}

interface AppSyncStackProps extends cdk.StackProps {
  stageName: string;
  databaseCluster: rds.DatabaseCluster;
  databaseSecret: secretsmanager.ISecret;
  alertTopicArn?: string;
  codeSigningConfigArn?: string;
}

export class AppSyncStack extends cdk.Stack {
  public readonly certificate: certmanager.ICertificate;
  public readonly appsyncDomainName: appsync.CfnDomainName;
  public readonly graphqlApi: AmplifyGraphqlApi;
  public readonly domainAssoc: appsync.CfnDomainNameApiAssociation;
  public readonly rdsDataSource: appsync.RdsDataSource;

  constructor(scope: Construct, id: string, props: AppSyncStackProps) {
    super(scope, id, props);

    const isProd = props.stageName === 'prod';

    this.certificate = certmanager.Certificate.fromCertificateArn(
      this,
      '21e5c51c-ff87-4657-b314-c1513558fea1',
      process.env.APPSYNC_CERT_ARN as string,
    );

    this.appsyncDomainName = new appsync.CfnDomainName(
      this,
      'AppsyncDomainName',
      {
        certificateArn: this.certificate.certificateArn,
        domainName: isProd
          ? 'api.have-foresight.app'
          : 'staging.api.have-foresight.app',
      },
    );

    // Read GraphQL schema
    const schemaPath = join(__dirname, '../graphql/schema.graphql');

    // Create AppSync GraphQL API
    this.graphqlApi = new AmplifyGraphqlApi(this, 'HealthcareRCMApi', {
      apiName: `healthcare-rcm-api-${props.stageName}`,
      definition: AmplifyGraphqlDefinition.fromFiles(schemaPath),

      authorizationModes: {
        defaultAuthorizationMode: appsync.AuthorizationType.OIDC,
        oidcConfig: {
          oidcIssuerUrl: process.env.CLERK_ISSUER_URL!,
          clientId: process.env.CLERK_PUBLISHABLE_KEY!,
          oidcProviderName: 'clerk',
          tokenExpiryFromIssue: Duration.minutes(10),
          tokenExpiryFromAuth: Duration.minutes(10),
        },
        apiKeyConfig: {
          expires: Duration.days(365),
          description: 'Healthcare RCM API Key for development',
        },
        iamConfig: {
          enableIamAuthorizationMode: true,
        },
      },
      logging: {
        retention: logs.RetentionDays.ONE_MONTH,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    // Add caching configuration for improved performance
    const cachingConfig = new appsync.CfnApiCache(this, 'HealthcareRCMApiCache', {
      apiId: this.graphqlApi.apiId,
      type: 'SMALL', // SMALL, MEDIUM, LARGE, XLARGE, LARGE_2X, LARGE_4X, LARGE_8X, LARGE_12X
      ttl: Duration.minutes(isProd ? 60 : 5).toSeconds(), // Longer TTL in production
      apiCachingBehavior: 'FULL_REQUEST_CACHING',
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
    });

    this.domainAssoc = new appsync.CfnDomainNameApiAssociation(
      this,
      'ForesightCfnDomainNameApiAssociation',
      {
        apiId: this.graphqlApi.apiId,
        domainName: isProd
          ? 'api.have-foresight.app'
          : 'staging.api.have-foresight.app',
      },
    );

    //  Required to ensure the resources are created in order
    this.domainAssoc.addDependency(this.appsyncDomainName);

    // Create RDS Data Source for Aurora PostgreSQL
    this.rdsDataSource = this.graphqlApi.addRdsDataSource(
      'RCMDatabaseDataSource',
      props.databaseCluster,
      props.databaseSecret,
      'rcm',
      {
        name: 'RCMDatabaseDataSource',
        description: 'Healthcare RCM PostgreSQL Aurora Database',
      },
    );

    // Grant necessary permissions for AppSync to access RDS Data API
    // The RDS data source automatically creates the necessary IAM permissions
    // for accessing the Aurora Serverless cluster via the Data API

    // Create resolvers for Patient operations
    this.createPatientResolvers();

    // Create resolvers for Claim operations
    this.createClaimResolvers();

    // Create resolvers for Prior Auth operations
    this.createPriorAuthResolvers();

    // Create resolvers for Organization operations
    this.createOrganizationResolvers();

    // Create resolvers for Real-time Analytics
    this.createAnalyticsResolvers();

    // Create Event API for publish/subscribe functionality using native AppSync EventApi
    const eventApi = new appsync.EventApi(this, 'HealthcareRCMEventApi', {
      apiName: `healthcare-rcm-events-${props.stageName}`,
      domainName: {
        domainName: isProd
          ? 'events.have-foresight.app'
          : 'staging.events.have-foresight.app',
        certificate: certmanager.Certificate.fromCertificateArn(
          this,
          'HealthcareRCMEventApiCertificate',
          process.env.EVENTS_CERT_ARN as string, // Use dedicated events certificate
        ),
      },
      authorizationConfig: {
        connectionAuthModeTypes: [AppSyncAuthorizationType.API_KEY, AppSyncAuthorizationType.OIDC],
        authProviders: [
          {
            apiKeyConfig: {
              expires: Expiration.after(Duration.days(365)),
              description: 'Healthcare RCM Event API Key for development',
            },
            authorizationType: AppSyncAuthorizationType.API_KEY,
          },
          {
            authorizationType: AppSyncAuthorizationType.OIDC,
            openIdConnectConfig: {
              oidcProvider: process.env.CLERK_ISSUER_URL!,
              clientId: process.env.CLERK_PUBLISHABLE_KEY!,
            },
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.AppSyncFieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_MONTH,
        role: iam.Role.fromRoleName(
          this,
          'HealthcareRCMEventApiLogRole',
          'HealthcareRCMEventApiLogRole',
        ),
      },
    });

    // Create DLQ for AppSync API failures
    const appsyncDlq = new sqs.Queue(this, 'AppSyncDLQ', {
      queueName: `rcm-appsync-dlq-${props.stageName}`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create DLQ for Event API failures
    const eventApiDlq = new sqs.Queue(this, 'EventApiDLQ', {
      queueName: `rcm-eventapi-dlq-${props.stageName}`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Import code signing configuration if provided
    const codeSigningConfig = props.codeSigningConfigArn
      ? lambda.CodeSigningConfig.fromCodeSigningConfigArn(
          this,
          'ImportedCodeSigningConfig',
          props.codeSigningConfigArn
        )
      : undefined;

    // Create Lambda function to handle AppSync errors and send to DLQ
    const appsyncErrorHandler = new lambdaNodejs.NodejsFunction(this, 'AppSyncErrorHandler', {
      functionName: `rcm-appsync-error-handler-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: join(__dirname, '../functions/appsync-error-handler.ts'),
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        APPSYNC_DLQ_URL: appsyncDlq.queueUrl,
        EVENT_API_DLQ_URL: eventApiDlq.queueUrl,
        ALERT_TOPIC_ARN: props.alertTopicArn ?? '',
        STAGE_NAME: props.stageName,
      },
      codeSigningConfig,
    });

    // Grant permissions for the error handler
    appsyncDlq.grantSendMessages(appsyncErrorHandler);
    eventApiDlq.grantSendMessages(appsyncErrorHandler);

    if (props.alertTopicArn) {
      appsyncErrorHandler.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [props.alertTopicArn],
        })
      );
    }

    // Create DLQ processor for AppSync errors
    const appsyncDlqProcessor = new lambdaNodejs.NodejsFunction(this, 'AppSyncDLQProcessor', {
      functionName: `rcm-appsync-dlq-processor-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: join(__dirname, '../functions/appsync-dlq-processor.ts'),
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        ALERT_TOPIC_ARN: props.alertTopicArn ?? '',
        STAGE_NAME: props.stageName,
      },
      codeSigningConfig,
    });

    // Add SQS triggers for DLQ processors
    appsyncDlqProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(appsyncDlq, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    appsyncDlqProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(eventApiDlq, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    // Grant permissions for DLQ processor
    if (props.alertTopicArn) {
      appsyncDlqProcessor.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sns:Publish',
            'cloudwatch:PutMetricData',
          ],
          resources: ['*'],
        })
      );
    }

    // Add compliance tags to signed functions
    if (codeSigningConfig) {
      cdk.Tags.of(appsyncErrorHandler).add('CodeSigningEnabled', 'true');
      cdk.Tags.of(appsyncErrorHandler).add('ComplianceLevel', 'HIPAA-SOC2');
      cdk.Tags.of(appsyncDlqProcessor).add('CodeSigningEnabled', 'true');
      cdk.Tags.of(appsyncDlqProcessor).add('ComplianceLevel', 'HIPAA-SOC2');
    }

    // Outputs for EventApi
    new cdk.CfnOutput(this, 'EventApiUrl', {
      value: eventApi.appSyncDomainName,
      description: 'Event API URL for real-time events',
      exportName: `RCM-EventApiUrl-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'EventApiId', {
      value: eventApi.apiId,
      description: 'Event API ID',
      exportName: `RCM-EventApiId-${props.stageName}`,
    });

    // Outputs for GraphQL API
    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: this.graphqlApi.graphqlUrl,
      description: 'GraphQL API URL',
      exportName: `RCM-GraphQLApiUrl-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'GraphQLApiId', {
      value: this.graphqlApi.apiId,
      description: 'GraphQL API ID',
      exportName: `RCM-GraphQLApiId-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'GraphQLApiKey', {
      value: this.graphqlApi.apiKey || 'Not available with IAM auth',
      description: 'GraphQL API Key',
      exportName: `RCM-GraphQLApiKey-${props.stageName}`,
    });

    // Outputs for DLQ
    new cdk.CfnOutput(this, 'AppSyncDLQArn', {
      value: appsyncDlq.queueArn,
      description: 'AppSync Dead Letter Queue ARN',
      exportName: `RCM-AppSyncDLQ-Arn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'EventApiDLQArn', {
      value: eventApiDlq.queueArn,
      description: 'Event API Dead Letter Queue ARN',
      exportName: `RCM-EventApiDLQ-Arn-${props.stageName}`,
    });
  }

  private createPatientResolvers(): void {
    const isProd = this.node.tryGetContext('stageName') === 'prod';

    // Get Patient Query Resolver
    this.rdsDataSource.createResolver('GetPatientResolver', {
      typeName: 'Query',
      fieldName: 'getPatient',
      cachingConfig: {
        ttl: Duration.minutes(isProd ? 15 : 5),
        cachingKeys: ['$context.identity'],
      },
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [
            "SELECT
              p.id, p.mrn, p.first_name as firstName, p.last_name as lastName,
              p.email, p.phone, p.date_of_birth as dateOfBirth, p.gender,
              p.status, p.organization_id as organizationId,
              p.created_at as createdAt, p.updated_at as updatedAt
            FROM patient p
            WHERE p.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($ctx.args.id)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() == 0)
          null
        #else
          #set($record = $ctx.result.records[0])
          {
            "id": "$record.id",
            "mrn": "$record.mrn",
            "firstName": "$record.firstName",
            "lastName": "$record.lastName",
            "email": "$record.email",
            "phone": "$record.phone",
            "dateOfBirth": "$record.dateOfBirth",
            "gender": "$record.gender",
            "status": "$record.status",
            "organizationId": "$record.organizationId",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #end
      `),
    });

    // List Patients by Organization Query Resolver
    this.rdsDataSource.createResolver('ListPatientsByOrganizationResolver', {
      typeName: 'Query',
      fieldName: 'listPatientsByOrganization',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($limit = $util.defaultIfNull($ctx.args.limit, 20))
        #set($offset = 0)
        #if($ctx.args.nextToken)
          #set($offset = $util.base64Decode($ctx.args.nextToken))
        #end

        {
          "version": "2018-05-29",
          "statements": [
            "SELECT
              p.id, p.mrn, p.first_name as firstName, p.last_name as lastName,
              p.email, p.phone, p.date_of_birth as dateOfBirth, p.gender,
              p.status, p.organization_id as organizationId,
              p.created_at as createdAt, p.updated_at as updatedAt
            FROM patient p
            WHERE p.organization_id = :organizationId
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset",
            "SELECT COUNT(*) as total FROM patient p WHERE p.organization_id = :organizationId"
          ],
          "variableMap": {
            ":organizationId": $util.toJson($ctx.args.organizationId),
            ":limit": $limit,
            ":offset": $offset
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($patients = [])
        #set($total = 0)

        #if($ctx.result.records.size() > 0)
          #foreach($record in $ctx.result.records[0])
            #set($patient = {
              "id": "$record.id",
              "mrn": "$record.mrn",
              "firstName": "$record.firstName",
              "lastName": "$record.lastName",
              "email": "$record.email",
              "phone": "$record.phone",
              "dateOfBirth": "$record.dateOfBirth",
              "gender": "$record.gender",
              "status": "$record.status",
              "organizationId": "$record.organizationId",
              "createdAt": "$record.createdAt",
              "updatedAt": "$record.updatedAt"
            })
            $util.qr($patients.add($patient))
          #end
        #end

        #if($ctx.result.records.size() > 1 && $ctx.result.records[1].size() > 0)
          #set($total = $ctx.result.records[1][0].total)
        #end

        #set($nextToken = "")
        #if($patients.size() == $ctx.args.limit)
          #set($nextOffset = $offset + $ctx.args.limit)
          #set($nextToken = $util.base64Encode($nextOffset))
        #end

        {
          "items": $util.toJson($patients),
          "nextToken": "$nextToken",
          "total": $total
        }
      `),
    });

    // Create Patient Mutation Resolver
    this.rdsDataSource.createResolver('CreatePatientResolver', {
      typeName: 'Mutation',
      fieldName: 'createPatient',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($id = $util.autoId())
        {
          "version": "2018-05-29",
          "statements": [
            "INSERT INTO patient (
              id, mrn, first_name, last_name, email, phone,
              date_of_birth, gender, status, organization_id,
              created_at, updated_at
            ) VALUES (
              :id, :mrn, :firstName, :lastName, :email, :phone,
              :dateOfBirth, :gender, 'active', :organizationId,
              NOW(), NOW()
            )",
            "SELECT
              p.id, p.mrn, p.first_name as firstName, p.last_name as lastName,
              p.email, p.phone, p.date_of_birth as dateOfBirth, p.gender,
              p.status, p.organization_id as organizationId,
              p.created_at as createdAt, p.updated_at as updatedAt
            FROM patient p WHERE p.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($id),
            ":mrn": $util.toJson($ctx.args.input.mrn),
            ":firstName": $util.toJson($ctx.args.input.firstName),
            ":lastName": $util.toJson($ctx.args.input.lastName),
            ":email": $util.toJson($ctx.args.input.email),
            ":phone": $util.toJson($ctx.args.input.phone),
            ":dateOfBirth": $util.toJson($ctx.args.input.dateOfBirth),
            ":gender": $util.toJson($ctx.args.input.gender),
            ":organizationId": $util.toJson($ctx.args.input.organizationId)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() > 1 && $ctx.result.records[1].size() > 0)
          #set($record = $ctx.result.records[1][0])
          {
            "id": "$record.id",
            "mrn": "$record.mrn",
            "firstName": "$record.firstName",
            "lastName": "$record.lastName",
            "email": "$record.email",
            "phone": "$record.phone",
            "dateOfBirth": "$record.dateOfBirth",
            "gender": "$record.gender",
            "status": "$record.status",
            "organizationId": "$record.organizationId",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #else
          $util.error("Failed to create patient")
        #end
      `),
    });
  }

  private createClaimResolvers(): void {
    const isProd = this.node.tryGetContext('stageName') === 'prod';

    // Get Claim Query Resolver
    this.rdsDataSource.createResolver('GetClaimResolver', {
      typeName: 'Query',
      fieldName: 'getClaim',
      cachingConfig: {
        ttl: Duration.minutes(isProd ? 10 : 3),
        cachingKeys: ['$context.identity'],
      },
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [
            "SELECT
              c.id, c.claim_number as claimNumber, c.patient_id as patientId,
              c.provider_id as providerId, c.payer_id as payerId, c.status,
              c.total_amount as totalAmount, c.submitted_date as submittedDate,
              c.processed_date as processedDate, c.organization_id as organizationId,
              c.created_at as createdAt, c.updated_at as updatedAt
            FROM claim c
            WHERE c.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($ctx.args.id)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() == 0)
          null
        #else
          #set($record = $ctx.result.records[0])
          {
            "id": "$record.id",
            "claimNumber": "$record.claimNumber",
            "patientId": "$record.patientId",
            "providerId": "$record.providerId",
            "payerId": "$record.payerId",
            "status": "$record.status",
            "totalAmount": $record.totalAmount,
            "submittedDate": "$record.submittedDate",
            "processedDate": "$record.processedDate",
            "organizationId": "$record.organizationId",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #end
      `),
    });

    // Update Claim Status Mutation Resolver
    this.rdsDataSource.createResolver('UpdateClaimStatusResolver', {
      typeName: 'Mutation',
      fieldName: 'updateClaimStatus',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [
            "UPDATE claim SET
              status = :status,
              updated_at = NOW()
            WHERE id = :id",
            "SELECT
              c.id, c.claim_number as claimNumber, c.patient_id as patientId,
              c.provider_id as providerId, c.payer_id as payerId, c.status,
              c.total_amount as totalAmount, c.submitted_date as submittedDate,
              c.processed_date as processedDate, c.organization_id as organizationId,
              c.created_at as createdAt, c.updated_at as updatedAt
            FROM claim c WHERE c.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($ctx.args.input.id),
            ":status": $util.toJson($ctx.args.input.status)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() > 1 && $ctx.result.records[1].size() > 0)
          #set($record = $ctx.result.records[1][0])
          {
            "id": "$record.id",
            "claimNumber": "$record.claimNumber",
            "patientId": "$record.patientId",
            "providerId": "$record.providerId",
            "payerId": "$record.payerId",
            "status": "$record.status",
            "totalAmount": $record.totalAmount,
            "submittedDate": "$record.submittedDate",
            "processedDate": "$record.processedDate",
            "organizationId": "$record.organizationId",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #else
          $util.error("Failed to update claim status or claim not found")
        #end
      `),
    });
  }

  private createPriorAuthResolvers(): void {
    // Create Prior Auth Mutation Resolver
    this.rdsDataSource.createResolver('CreatePriorAuthResolver', {
      typeName: 'Mutation',
      fieldName: 'createPriorAuth',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($id = $util.autoId())
        {
          "version": "2018-05-29",
          "statements": [
            "INSERT INTO prior_auth (
              id, auth_number, patient_id, provider_id, payer_id,
              status, requested_date, organization_id, created_at, updated_at
            ) VALUES (
              :id, :authNumber, :patientId, :providerId, :payerId,
              'pending', :requestedDate, :organizationId, NOW(), NOW()
            )",
            "SELECT
              pa.id, pa.auth_number as authNumber, pa.patient_id as patientId,
              pa.provider_id as providerId, pa.payer_id as payerId, pa.status,
              pa.requested_date as requestedDate, pa.approved_date as approvedDate,
              pa.expiration_date as expirationDate, pa.notes,
              pa.organization_id as organizationId, pa.created_at as createdAt,
              pa.updated_at as updatedAt
            FROM prior_auth pa WHERE pa.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($id),
            ":authNumber": $util.toJson($ctx.args.input.authNumber),
            ":patientId": $util.toJson($ctx.args.input.patientId),
            ":providerId": $util.toJson($ctx.args.input.providerId),
            ":payerId": $util.toJson($ctx.args.input.payerId),
            ":requestedDate": $util.toJson($ctx.args.input.requestedDate),
            ":organizationId": $util.toJson($ctx.args.input.organizationId)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() > 1 && $ctx.result.records[1].size() > 0)
          #set($record = $ctx.result.records[1][0])
          {
            "id": "$record.id",
            "authNumber": "$record.authNumber",
            "patientId": "$record.patientId",
            "providerId": "$record.providerId",
            "payerId": "$record.payerId",
            "status": "$record.status",
            "requestedDate": "$record.requestedDate",
            "approvedDate": "$record.approvedDate",
            "expirationDate": "$record.expirationDate",
            "notes": "$record.notes",
            "organizationId": "$record.organizationId",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #else
          $util.error("Failed to create prior authorization")
        #end
      `),
    });
  }

  private createOrganizationResolvers(): void {
    const isProd = this.node.tryGetContext('stageName') === 'prod';

    // Get Organization Query Resolver
    this.rdsDataSource.createResolver('GetOrganizationResolver', {
      typeName: 'Query',
      fieldName: 'getOrganization',
      cachingConfig: {
        ttl: Duration.minutes(isProd ? 30 : 10),
        cachingKeys: ['$context.identity'],
      },
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [
            "SELECT
              o.id, o.name, o.tax_id as taxId, o.address, o.phone, o.email,
              o.created_at as createdAt, o.updated_at as updatedAt
            FROM organization o
            WHERE o.id = :id"
          ],
          "variableMap": {
            ":id": $util.toJson($ctx.args.id)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.result.records.size() == 0)
          null
        #else
          #set($record = $ctx.result.records[0])
          {
            "id": "$record.id",
            "name": "$record.name",
            "taxId": "$record.taxId",
            "address": "$record.address",
            "phone": "$record.phone",
            "email": "$record.email",
            "createdAt": "$record.createdAt",
            "updatedAt": "$record.updatedAt"
          }
        #end
      `),
    });
  }

  private createAnalyticsResolvers(): void {
    const isProd = this.node.tryGetContext('stageName') === 'prod';

    // Get Realtime Metrics Query Resolver
    this.rdsDataSource.createResolver('GetRealtimeMetricsResolver', {
      typeName: 'Query',
      fieldName: 'getRealtimeMetrics',
      cachingConfig: {
        ttl: Duration.minutes(isProd ? 2 : 1),
        cachingKeys: ['$context.arguments.organizationId'],
      },
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [
            "SELECT COUNT(*) as activePAs FROM prior_auth WHERE organization_id = :organizationId AND status = 'pending'",
            "SELECT COUNT(*) as pendingClaims FROM claim WHERE organization_id = :organizationId AND status IN ('pending', 'submitted', 'needs_review')"
          ],
          "variableMap": {
            ":organizationId": $util.toJson($ctx.args.organizationId)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($activePAs = 0)
        #set($pendingClaims = 0)

        #if($ctx.result.records.size() > 0 && $ctx.result.records[0].size() > 0)
          #set($activePAs = $ctx.result.records[0][0].activePAs)
        #end

        #if($ctx.result.records.size() > 1 && $ctx.result.records[1].size() > 0)
          #set($pendingClaims = $ctx.result.records[1][0].pendingClaims)
        #end

        {
          "organizationId": "$ctx.args.organizationId",
          "activePAs": $activePAs,
          "pendingClaims": $pendingClaims,
          "ehrSyncStatus": {},
          "healthLakeJobs": [],
          "timestamp": "$util.time.nowISO8601()"
        }
      `),
    });
  }
}

import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { eq, and } from 'drizzle-orm';
import { claims, patients } from '@foresight-cdss-next/db/schema';

const rdsDataClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Initialize Drizzle with RDS Data API and schema
const db = drizzle(rdsDataClient, {
  database: process.env.DATABASE_NAME,
  secretArn: process.env.DATABASE_SECRET_ARN,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
  schema: { claims, patients }
});

export const handler = async (event: any) => {
    console.log(
        'Claims API request received: method=%s resource=%s requestId=%s',
        event.httpMethod,
        event.resource || event.rawPath,
        event.requestContext?.requestId
    );

    try {
        const { httpMethod, pathParameters, queryStringParameters, body } = event;

        // Extract user context from authorizer
        const { userId, organizationId } = event.requestContext.authorizer;

        let response;

        switch (httpMethod) {
            case 'GET':
                if (pathParameters && pathParameters.id) {
                    response = await getClaim(pathParameters.id, organizationId);
                } else {
                    response = await listClaims(queryStringParameters, organizationId);
                }
                break;

            case 'POST':
                response = await createClaim(JSON.parse(body), organizationId, userId);
                break;

            case 'PUT':
                response = await updateClaim(pathParameters.id, JSON.parse(body), organizationId, userId);
                break;

            case 'DELETE':
                response = await deleteClaim(pathParameters.id, organizationId, userId);
                break;

            default:
                throw new Error(`Unsupported method: ${httpMethod}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify(response),
        };

    } catch (error) {
        console.error('Claims API error:', error);
        return {
            statusCode: error.statusCode || 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: error.message || 'Internal server error',
            }),
        };
    }
};

async function listClaims(queryParams: any = {}, organizationId: any) {
    const { limit = 50, offset = 0, status, patient_id } = queryParams;

    try {
        console.log('Executing listClaims query: limit=%d offset=%d', Number.parseInt(limit), Number.parseInt(offset));

        const whereConditions = [eq(claims.organizationId, organizationId)];

        if (status) {
            whereConditions.push(eq(claims.status, status));
        }

        if (patient_id) {
            whereConditions.push(eq(claims.patientId, patient_id));
        }

        const query = db
            .select({
                id: claims.id,
                patientId: claims.patientId,
                providerId: claims.providerId,
                status: claims.status,
                totalCharges: claims.totalCharges,
                submissionDate: claims.submissionDate,
                createdAt: claims.createdAt,
                updatedAt: claims.updatedAt,
                firstName: patients.firstName,
                lastName: patients.lastName
            })
            .from(claims)
            .leftJoin(patients, eq(claims.patientId, patients.id))
            .where(and(...whereConditions));

        const results = await query
            .limit(Number.parseInt(limit))
            .offset(Number.parseInt(offset));

        return {
            claims: results,
            total: results.length,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset)
        };
    } catch (error) {
        console.error('Error in listClaims:', error);
        throw error;
    }
}

async function getClaim(claimId: any, organizationId: any) {
    try {
        console.log('Getting claim: claimId=%s', claimId);

        const result = await db
            .select({
                id: claims.id,
                patientId: claims.patientId,
                providerId: claims.providerId,
                totalCharges: claims.totalCharges,
                status: claims.status,
                submissionDate: claims.submissionDate,
                createdAt: claims.createdAt,
                updatedAt: claims.updatedAt,
                firstName: patients.firstName,
                lastName: patients.lastName,
                dateOfBirth: patients.dateOfBirth
            })
            .from(claims)
            .leftJoin(patients, eq(claims.patientId, patients.id))
            .where(and(eq(claims.id, claimId), eq(claims.organizationId, organizationId)))
            .limit(1);

        if (result.length === 0) {
            throw new Error('Claim not found');
        }

        return result[0];
    } catch (error) {
        console.error('Error in getClaim:', error);
        throw error;
    }
}

async function createClaim(claimData: any, organizationId: any, userId: any) {
    const claimId = `clm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    try {
        console.log('Creating claim: claimId=%s', claimId);

        const newClaim = {
            id: claimId,
            organizationId,
            patientId: claimData.patientId,
            providerId: claimData.providerId,
            payerId: claimData.payerId,
            serviceDate: claimData.serviceDate,
            totalCharges: claimData.amount.toString(),
            status: (claimData.submit ? 'submitted' : 'draft') as 'draft' | 'submitted',
            createdBy: userId
        };

        await db.insert(claims).values(newClaim);

        // Queue for processing if submitted
        if (claimData.submit) {
            await queueClaimForProcessing({
                claimId,
                ...claimData,
                organizationId
            });
        }

        return {
            ...newClaim,
            created_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in createClaim:', error);
        throw error;
    }
}

async function updateClaim(claimId: any, claimData: any, organizationId: any, userId: any) {
    try {
        console.log('Updating claim: claimId=%s', claimId);

        const updateData = {
            patientId: claimData.patientId,
            providerId: claimData.providerId,
            totalCharges: claimData.amount?.toString(),
            updatedBy: userId,
            updatedAt: new Date()
        };

        await db
            .update(claims)
            .set(updateData)
            .where(and(eq(claims.id, claimId), eq(claims.organizationId, organizationId)));

        return {
            id: claimId,
            ...claimData,
            updated_at: updateData.updatedAt.toISOString()
        };
    } catch (error) {
        console.error('Error in updateClaim:', error);
        throw error;
    }
}

async function deleteClaim(claimId: any, organizationId: any, userId: any) {
    try {
        console.log('Deleting claim: claimId=%s', claimId);

        const deletedAt = new Date();

        await db
            .update(claims)
            .set({
                deletedAt,
                updatedBy: userId
            })
            .where(and(eq(claims.id, claimId), eq(claims.organizationId, organizationId)));

        return {
            id: claimId,
            deleted: true,
            deleted_at: deletedAt.toISOString()
        };
    } catch (error) {
        console.error('Error in deleteClaim:', error);
        throw error;
    }
}

async function queueClaimForProcessing(claimData: any) {
    try {
        const queueUrl = process.env.CLAIMS_QUEUE_URL;
        if (!queueUrl) {
            console.warn('Claims queue URL not configured');
            return;
        }

        console.log('Queuing claim for processing: claimId=%s organizationId=%s', claimData.claimId, claimData.organizationId);

        // SQS implementation would go here when needed

    } catch (error) {
        console.error('Failed to queue claim for processing:', error);
        // Don't throw - queuing failure shouldn't fail the API
    }
}

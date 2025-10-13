const AWS = require('aws-sdk');

const rdsDataClient = new AWS.RDSDataService();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
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

async function listClaims(queryParams = {}, organizationId) {
    const { limit = 50, offset = 0, status, patient_id } = queryParams;
    
    let sql = `
        SELECT c.claim_id, c.patient_id, c.provider_id, c.service_code, c.amount, 
               c.status, c.submitted_at, c.created_at, c.updated_at,
               p.first_name, p.last_name
        FROM claims c
        LEFT JOIN patients p ON c.patient_id = p.patient_id
        WHERE c.organization_id = :organizationId
    `;
    
    const parameters = [
        { name: 'organizationId', value: { stringValue: organizationId } },
        { name: 'limit', value: { longValue: parseInt(limit) } },
        { name: 'offset', value: { longValue: parseInt(offset) } }
    ];
    
    if (status) {
        sql += ` AND c.status = :status`;
        parameters.push({ name: 'status', value: { stringValue: status } });
    }
    
    if (patient_id) {
        sql += ` AND c.patient_id = :patientId`;
        parameters.push({ name: 'patientId', value: { stringValue: patient_id } });
    }
    
    sql += ` ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset`;
    
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql,
        parameters
    };
    
    console.log('Executing listClaims query: limit=%d offset=%d', parseInt(limit), parseInt(offset));
    // const result = await rdsDataClient.executeStatement(params).promise();
    
    // Mock result for now
    return {
        claims: [
            {
                claim_id: 'clm_1',
                patient_id: 'pat_1',
                provider_id: 'prov_1',
                service_code: '99213',
                amount: 150.00,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                first_name: 'John',
                last_name: 'Doe'
            }
        ],
        total: 1,
        limit: parseInt(limit),
        offset: parseInt(offset)
    };
}

async function getClaim(claimId, organizationId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            SELECT c.*, p.first_name, p.last_name, p.date_of_birth, p.insurance_id
            FROM claims c
            LEFT JOIN patients p ON c.patient_id = p.patient_id
            WHERE c.claim_id = :claimId AND c.organization_id = :organizationId
        `,
        parameters: [
            { name: 'claimId', value: { stringValue: claimId } },
            { name: 'organizationId', value: { stringValue: organizationId } }
        ]
    };
    
    console.log('Getting claim: claimId=%s', claimId);
    // const result = await rdsDataClient.executeStatement(params).promise();
    
    // Mock result
    return {
        claim_id: claimId,
        patient_id: 'pat_1',
        provider_id: 'prov_1',
        service_code: '99213',
        amount: 150.00,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-01-01',
        insurance_id: 'INS123456'
    };
}

async function createClaim(claimData, organizationId, userId) {
    const claimId = `clm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store claim in database
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            INSERT INTO claims (claim_id, organization_id, patient_id, provider_id, 
                              service_code, amount, status, created_by, created_at)
            VALUES (:claimId, :organizationId, :patientId, :providerId, 
                    :serviceCode, :amount, 'draft', :createdBy, NOW())
        `,
        parameters: [
            { name: 'claimId', value: { stringValue: claimId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'patientId', value: { stringValue: claimData.patientId } },
            { name: 'providerId', value: { stringValue: claimData.providerId } },
            { name: 'serviceCode', value: { stringValue: claimData.serviceCode } },
            { name: 'amount', value: { doubleValue: claimData.amount } },
            { name: 'createdBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Creating claim: claimId=%s serviceCode=%s', claimId, claimData.serviceCode);
    // await rdsDataClient.executeStatement(params).promise();
    
    // Queue for processing if submitted
    if (claimData.submit) {
        await queueClaimForProcessing({
            claimId,
            ...claimData,
            organizationId
        });
    }
    
    return {
        claim_id: claimId,
        ...claimData,
        status: claimData.submit ? 'queued' : 'draft',
        created_at: new Date().toISOString()
    };
}

async function updateClaim(claimId, claimData, organizationId, userId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            UPDATE claims 
            SET patient_id = :patientId, provider_id = :providerId, service_code = :serviceCode,
                amount = :amount, updated_by = :updatedBy, updated_at = NOW()
            WHERE claim_id = :claimId AND organization_id = :organizationId
        `,
        parameters: [
            { name: 'claimId', value: { stringValue: claimId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'patientId', value: { stringValue: claimData.patientId } },
            { name: 'providerId', value: { stringValue: claimData.providerId } },
            { name: 'serviceCode', value: { stringValue: claimData.serviceCode } },
            { name: 'amount', value: { doubleValue: claimData.amount } },
            { name: 'updatedBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Updating claim: claimId=%s', claimId);
    // await rdsDataClient.executeStatement(params).promise();
    
    return {
        claim_id: claimId,
        ...claimData,
        updated_at: new Date().toISOString()
    };
}

async function deleteClaim(claimId, organizationId, userId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            UPDATE claims 
            SET status = 'deleted', deleted_at = NOW(), deleted_by = :deletedBy
            WHERE claim_id = :claimId AND organization_id = :organizationId
        `,
        parameters: [
            { name: 'claimId', value: { stringValue: claimId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'deletedBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Deleting claim: claimId=%s', claimId);
    // await rdsDataClient.executeStatement(params).promise();
    
    return {
        claim_id: claimId,
        deleted: true,
        deleted_at: new Date().toISOString()
    };
}

async function queueClaimForProcessing(claimData) {
    try {
        const queueUrl = process.env.CLAIMS_QUEUE_URL;
        if (!queueUrl) {
            console.warn('Claims queue URL not configured');
            return;
        }
        
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(claimData),
            MessageGroupId: claimData.organizationId, // For FIFO queue
            MessageDeduplicationId: `${claimData.claimId}_${Date.now()}`
        };
        
        console.log('Queuing claim for processing: claimId=%s organizationId=%s', claimData.claimId, claimData.organizationId);
        // await sqs.sendMessage(params).promise();
        
    } catch (error) {
        console.error('Failed to queue claim for processing:', error);
        // Don't throw - queuing failure shouldn't fail the API
    }
}
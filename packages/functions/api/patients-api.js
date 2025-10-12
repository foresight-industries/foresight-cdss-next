const AWS = require('aws-sdk');

const rdsDataClient = new AWS.RDSDataService();

exports.handler = async (event) => {
    console.log('Patients API event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, pathParameters, queryStringParameters, body } = event;
        const path = event.resource;
        
        // Extract user context from authorizer
        const { userId, organizationId } = event.requestContext.authorizer;
        
        let response;
        
        switch (httpMethod) {
            case 'GET':
                if (pathParameters && pathParameters.id) {
                    response = await getPatient(pathParameters.id, organizationId);
                } else {
                    response = await listPatients(queryStringParameters, organizationId);
                }
                break;
                
            case 'POST':
                response = await createPatient(JSON.parse(body), organizationId, userId);
                break;
                
            case 'PUT':
                response = await updatePatient(pathParameters.id, JSON.parse(body), organizationId, userId);
                break;
                
            case 'DELETE':
                response = await deletePatient(pathParameters.id, organizationId, userId);
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
        console.error('Patients API error:', error);
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

async function listPatients(queryParams = {}, organizationId) {
    const { limit = 50, offset = 0, search } = queryParams;
    
    let sql = `
        SELECT patient_id, first_name, last_name, date_of_birth, phone, email, 
               insurance_id, created_at, updated_at
        FROM patients 
        WHERE organization_id = :organizationId
    `;
    
    const parameters = [
        { name: 'organizationId', value: { stringValue: organizationId } },
        { name: 'limit', value: { longValue: parseInt(limit) } },
        { name: 'offset', value: { longValue: parseInt(offset) } }
    ];
    
    if (search) {
        sql += ` AND (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)`;
        parameters.push({ name: 'search', value: { stringValue: `%${search}%` } });
    }
    
    sql += ` ORDER BY last_name, first_name LIMIT :limit OFFSET :offset`;
    
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql,
        parameters
    };
    
    console.log('Executing SQL:', JSON.stringify(params, null, 2));
    // const result = await rdsDataClient.executeStatement(params).promise();
    
    // Mock result for now
    return {
        patients: [
            {
                patient_id: 'pat_1',
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1980-01-01',
                phone: '555-0123',
                email: 'john.doe@example.com',
                insurance_id: 'INS123456',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ],
        total: 1,
        limit: parseInt(limit),
        offset: parseInt(offset)
    };
}

async function getPatient(patientId, organizationId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            SELECT * FROM patients 
            WHERE patient_id = :patientId AND organization_id = :organizationId
        `,
        parameters: [
            { name: 'patientId', value: { stringValue: patientId } },
            { name: 'organizationId', value: { stringValue: organizationId } }
        ]
    };
    
    console.log('Getting patient:', JSON.stringify(params, null, 2));
    // const result = await rdsDataClient.executeStatement(params).promise();
    
    // Mock result
    return {
        patient_id: patientId,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-01-01',
        phone: '555-0123',
        email: 'john.doe@example.com',
        insurance_id: 'INS123456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

async function createPatient(patientData, organizationId, userId) {
    const patientId = `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            INSERT INTO patients (patient_id, organization_id, first_name, last_name, 
                                date_of_birth, phone, email, insurance_id, created_by, created_at)
            VALUES (:patientId, :organizationId, :firstName, :lastName, :dateOfBirth, 
                    :phone, :email, :insuranceId, :createdBy, NOW())
        `,
        parameters: [
            { name: 'patientId', value: { stringValue: patientId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'firstName', value: { stringValue: patientData.firstName } },
            { name: 'lastName', value: { stringValue: patientData.lastName } },
            { name: 'dateOfBirth', value: { stringValue: patientData.dateOfBirth } },
            { name: 'phone', value: { stringValue: patientData.phone || '' } },
            { name: 'email', value: { stringValue: patientData.email || '' } },
            { name: 'insuranceId', value: { stringValue: patientData.insuranceId || '' } },
            { name: 'createdBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Creating patient:', JSON.stringify(params, null, 2));
    // await rdsDataClient.executeStatement(params).promise();
    
    return {
        patient_id: patientId,
        ...patientData,
        created_at: new Date().toISOString()
    };
}

async function updatePatient(patientId, patientData, organizationId, userId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            UPDATE patients 
            SET first_name = :firstName, last_name = :lastName, date_of_birth = :dateOfBirth,
                phone = :phone, email = :email, insurance_id = :insuranceId,
                updated_by = :updatedBy, updated_at = NOW()
            WHERE patient_id = :patientId AND organization_id = :organizationId
        `,
        parameters: [
            { name: 'patientId', value: { stringValue: patientId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'firstName', value: { stringValue: patientData.firstName } },
            { name: 'lastName', value: { stringValue: patientData.lastName } },
            { name: 'dateOfBirth', value: { stringValue: patientData.dateOfBirth } },
            { name: 'phone', value: { stringValue: patientData.phone || '' } },
            { name: 'email', value: { stringValue: patientData.email || '' } },
            { name: 'insuranceId', value: { stringValue: patientData.insuranceId || '' } },
            { name: 'updatedBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Updating patient:', JSON.stringify(params, null, 2));
    // await rdsDataClient.executeStatement(params).promise();
    
    return {
        patient_id: patientId,
        ...patientData,
        updated_at: new Date().toISOString()
    };
}

async function deletePatient(patientId, organizationId, userId) {
    const params = {
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: `
            UPDATE patients 
            SET deleted_at = NOW(), deleted_by = :deletedBy
            WHERE patient_id = :patientId AND organization_id = :organizationId
        `,
        parameters: [
            { name: 'patientId', value: { stringValue: patientId } },
            { name: 'organizationId', value: { stringValue: organizationId } },
            { name: 'deletedBy', value: { stringValue: userId } }
        ]
    };
    
    console.log('Deleting patient:', JSON.stringify(params, null, 2));
    // await rdsDataClient.executeStatement(params).promise();
    
    return {
        patient_id: patientId,
        deleted: true,
        deleted_at: new Date().toISOString()
    };
}
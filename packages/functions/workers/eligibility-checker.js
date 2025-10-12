const AWS = require('aws-sdk');
const https = require('https');

const rdsDataClient = new AWS.RDSDataService();

exports.handler = async (event) => {
    console.log('Eligibility checker event:', JSON.stringify(event, null, 2));
    
    const results = [];
    const batchItemFailures = [];
    
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log('Checking eligibility:', message);
            
            const result = await checkEligibility(message);
            results.push(result);
            
        } catch (error) {
            console.error('Error checking eligibility:', error);
            batchItemFailures.push({
                itemIdentifier: record.messageId
            });
        }
    }
    
    return {
        batchItemFailures
    };
};

async function checkEligibility(eligibilityRequest) {
    const { patientId, memberId, providerId, serviceCode, serviceDate } = eligibilityRequest;
    
    try {
        // Check local cache first
        const cachedResult = await getCachedEligibility(patientId, serviceDate);
        if (cachedResult) {
            console.log('Returning cached eligibility result');
            return cachedResult;
        }
        
        // Call external payer API
        const eligibilityResult = await callPayerAPI({
            memberId,
            providerId,
            serviceCode,
            serviceDate
        });
        
        // Cache the result
        await cacheEligibilityResult(patientId, serviceDate, eligibilityResult);
        
        // Store in database
        await storeEligibilityResult({
            patientId,
            memberId,
            providerId,
            serviceCode,
            serviceDate,
            ...eligibilityResult
        });
        
        return {
            patientId,
            eligible: eligibilityResult.eligible,
            benefits: eligibilityResult.benefits,
            copay: eligibilityResult.copay,
            deductible: eligibilityResult.deductible,
            checkedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Eligibility check failed:', error);
        throw new Error(`Failed to check eligibility for patient ${patientId}: ${error.message}`);
    }
}

async function getCachedEligibility(patientId, serviceDate) {
    try {
        const params = {
            resourceArn: process.env.DATABASE_CLUSTER_ARN,
            secretArn: process.env.DATABASE_SECRET_ARN,
            database: process.env.DATABASE_NAME,
            sql: `
                SELECT * FROM eligibility_cache 
                WHERE patient_id = :patientId 
                AND service_date = :serviceDate 
                AND created_at > NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC 
                LIMIT 1
            `,
            parameters: [
                { name: 'patientId', value: { stringValue: patientId } },
                { name: 'serviceDate', value: { stringValue: serviceDate } }
            ]
        };
        
        console.log('Checking cache:', JSON.stringify(params, null, 2));
        // const result = await rdsDataClient.executeStatement(params).promise();
        
        // Mock cached result (would return actual data from database)
        return null; // No cache for demo
        
    } catch (error) {
        console.error('Cache lookup failed:', error);
        return null; // Proceed without cache
    }
}

async function callPayerAPI(requestData) {
    const { memberId, providerId, serviceCode, serviceDate } = requestData;
    
    // Mock external payer API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const isEligible = Math.random() > 0.2; // 80% eligible
            resolve({
                eligible: isEligible,
                benefits: isEligible ? {
                    coverageLevel: 'active',
                    planType: 'HMO',
                    effectiveDate: '2024-01-01',
                    terminationDate: '2024-12-31'
                } : null,
                copay: isEligible ? Math.floor(Math.random() * 50) + 10 : 0,
                deductible: isEligible ? {
                    remaining: Math.floor(Math.random() * 2000),
                    total: 2000
                } : null,
                responseCode: isEligible ? '00' : '01',
                responseMessage: isEligible ? 'Active coverage' : 'No active coverage'
            });
        }, 500); // Simulate API delay
    });
}

async function cacheEligibilityResult(patientId, serviceDate, result) {
    try {
        const params = {
            resourceArn: process.env.DATABASE_CLUSTER_ARN,
            secretArn: process.env.DATABASE_SECRET_ARN,
            database: process.env.DATABASE_NAME,
            sql: `
                INSERT INTO eligibility_cache (patient_id, service_date, eligible, benefits, copay, deductible, created_at)
                VALUES (:patientId, :serviceDate, :eligible, :benefits, :copay, :deductible, NOW())
                ON CONFLICT (patient_id, service_date) DO UPDATE SET
                eligible = :eligible,
                benefits = :benefits,
                copay = :copay,
                deductible = :deductible,
                updated_at = NOW()
            `,
            parameters: [
                { name: 'patientId', value: { stringValue: patientId } },
                { name: 'serviceDate', value: { stringValue: serviceDate } },
                { name: 'eligible', value: { booleanValue: result.eligible } },
                { name: 'benefits', value: { stringValue: JSON.stringify(result.benefits) } },
                { name: 'copay', value: { doubleValue: result.copay } },
                { name: 'deductible', value: { stringValue: JSON.stringify(result.deductible) } }
            ]
        };
        
        console.log('Caching result:', JSON.stringify(params, null, 2));
        // await rdsDataClient.executeStatement(params).promise();
        
    } catch (error) {
        console.error('Failed to cache eligibility result:', error);
        // Don't throw - caching failure shouldn't fail the check
    }
}

async function storeEligibilityResult(data) {
    try {
        const params = {
            resourceArn: process.env.DATABASE_CLUSTER_ARN,
            secretArn: process.env.DATABASE_SECRET_ARN,
            database: process.env.DATABASE_NAME,
            sql: `
                INSERT INTO eligibility_checks (patient_id, member_id, provider_id, service_code, service_date, eligible, benefits, copay, deductible, checked_at)
                VALUES (:patientId, :memberId, :providerId, :serviceCode, :serviceDate, :eligible, :benefits, :copay, :deductible, NOW())
            `,
            parameters: [
                { name: 'patientId', value: { stringValue: data.patientId } },
                { name: 'memberId', value: { stringValue: data.memberId } },
                { name: 'providerId', value: { stringValue: data.providerId } },
                { name: 'serviceCode', value: { stringValue: data.serviceCode } },
                { name: 'serviceDate', value: { stringValue: data.serviceDate } },
                { name: 'eligible', value: { booleanValue: data.eligible } },
                { name: 'benefits', value: { stringValue: JSON.stringify(data.benefits) } },
                { name: 'copay', value: { doubleValue: data.copay } },
                { name: 'deductible', value: { stringValue: JSON.stringify(data.deductible) } }
            ]
        };
        
        console.log('Storing eligibility result:', JSON.stringify(params, null, 2));
        // await rdsDataClient.executeStatement(params).promise();
        
    } catch (error) {
        console.error('Failed to store eligibility result:', error);
        throw error; // This should fail the function
    }
}
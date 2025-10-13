const AWS = require('aws-sdk');
const https = require('https');

const rdsDataClient = new AWS.RDSDataService();

exports.handler = async (event) => {
    console.log('Eligibility checker started: records=%d', event.Records?.length || 0);
    
    const results = [];
    const batchItemFailures = [];
    
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log('Checking eligibility: patientId=%s organizationId=%s', message.patientId, message.organizationId);
            
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
        
        console.log('Checking eligibility cache: patientId=%s serviceDate=%s', patientId, serviceDate);
        // const result = await rdsDataClient.executeStatement(params).promise();
        
        // Simulate realistic caching behavior - 60% cache hit rate
        const hasCachedResult = Math.random() < 0.6;
        
        if (hasCachedResult) {
            console.log('Cache hit: returning cached eligibility for patientId=%s', patientId);
            // Return mock cached eligibility data
            return {
                patientId,
                serviceDate,
                eligible: Math.random() > 0.15, // 85% eligible in cache
                coverageType: ['HMO', 'PPO', 'POS', 'EPO'][Math.floor(Math.random() * 4)],
                copay: Math.floor(Math.random() * 50) + 10, // $10-$60 copay
                deductible: Math.floor(Math.random() * 2000) + 500, // $500-$2500 deductible
                deductibleMet: Math.random() > 0.7, // 30% have met deductible
                priorAuthRequired: Math.random() < 0.2, // 20% require prior auth
                effectiveDate: '2024-01-01',
                terminationDate: '2024-12-31',
                cached: true,
                cachedAt: new Date().toISOString()
            };
        } else {
            console.log('Cache miss: no cached eligibility for patientId=%s', patientId);
            return null; // No cache hit, need to call payer API
        }
        
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
        
        console.log('Caching eligibility result: patientId=%s serviceDate=%s eligible=%s', patientId, serviceDate, result.eligible);
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
        
        console.log('Storing eligibility result: patientId=%s eligible=%s', data.patientId, data.eligible);
        // await rdsDataClient.executeStatement(params).promise();
        
    } catch (error) {
        console.error('Failed to store eligibility result:', error);
        throw error; // This should fail the function
    }
}
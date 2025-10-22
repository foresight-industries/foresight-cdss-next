import { db } from '@foresight-cdss-next/db';
import { sql } from 'drizzle-orm';

interface ClaimData {
    claimId: string;
    patientId: string;
    providerId: string;
    serviceCode: string;
    amount: number;
    organizationId: string;
}

export const handler = async (event: any) => {
    console.log('Claims processor started: records=%d', event.Records?.length || 0);

    const results = [];
    const batchItemFailures = [];

    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log('Processing claim: claimId=%s organizationId=%s', message.claimId, message.organizationId);

            // Simulate claim processing
            const result = await processClaim(message);
            results.push(result);

        } catch (error) {
            console.error('Error processing claim:', error);
            batchItemFailures.push({
                itemIdentifier: record.messageId
            });
        }
    }

    return {
        batchItemFailures
    };
};

async function processClaim(claim: ClaimData) {
    const { claimId, patientId, providerId, serviceCode, amount } = claim;

    try {
        console.log('Processing claim with data:', { claimId, patientId, providerId, serviceCode, amount });

        // Use Drizzle sql helper for type-safe database operations
        await db.execute(sql`
            INSERT INTO claims (id, patient_id, provider_id, service_code, total_charges, status, created_at, updated_at)
            VALUES (${claimId}, ${patientId}, ${providerId}, ${serviceCode}, ${amount.toString()}, ${'processing'}, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
            status = ${'processing'},
            updated_at = NOW()
        `);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            claimId,
            status: 'processed',
            processedAt: new Date().toISOString()
        };

    } catch (error: any) {
        console.error('Database error:', error);
        throw new Error(`Failed to process claim ${claimId}: ${error.message}`);
    }
}

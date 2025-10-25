import { ClaimsWorkflowIntegrationService } from '@foresight-cdss-next/db';

export default async (event) => {
    console.log('Submit claim workflow: patientId=%s serviceCode=%s specialty=%s',
        event.patientId, event.serviceCode, event.specialty);

    try {
        const { patientId, serviceCode, providerId, amount, organizationId, specialty, payerId } = event;

        // Use specialty-specific workflow if specialty is provided
        if (specialty && organizationId) {
            const integrationService = new ClaimsWorkflowIntegrationService();

            const claimId = event.claimId || `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const claimData = {
                claimId,
                claimType: event.claimType || 'PROFESSIONAL',
                specialty,
                organizationId,
                payerId: payerId || 'default',
                patientId,
                providerId,
                serviceLines: [{
                    lineNumber: 1,
                    procedureCode: serviceCode,
                    procedureDescription: event.procedureDescription || `Procedure ${serviceCode}`,
                    modifiers: event.modifiers || [],
                    units: event.units || 1,
                    chargeAmount: amount,
                    diagnosisPointers: [1],
                    dateOfService: new Date(event.serviceDate || Date.now())
                }],
                totalCharges: amount,
                serviceDate: new Date(event.serviceDate || Date.now()),
                submissionDate: new Date(),
                patientAge: event.patientAge || 35,
                patientGender: event.patientGender || 'U',
                diagnosisCodes: event.diagnosisCodes || [],
                placeOfService: event.placeOfService || '11',
                supportingDocuments: event.supportingDocuments || [],
                submissionMethod: event.submissionMethod || 'EDI',
                priority: event.priority || 'ROUTINE'
            };

            const workflowRequest = {
                claimId,
                organizationId,
                payerId: payerId || 'default',
                specialty,
                claimType: event.claimType || 'PROFESSIONAL',
                automationLevel: event.automationLevel || 'human_in_loop',
                claimData,
                priority: event.priority || 'medium',
                validateOnly: false
            };

            const result = await integrationService.orchestrateClaimsWorkflow(workflowRequest);

            return {
                statusCode: 200,
                body: {
                    claimId: result.claimId,
                    patientId,
                    serviceCode,
                    providerId,
                    amount,
                    status: result.status,
                    success: result.success,
                    confirmationNumber: result.confirmationNumber,
                    humanReviewRequired: result.humanReviewRequired,
                    reviewId: result.reviewId,
                    submittedAt: new Date().toISOString(),
                    payerResponse: {
                        confirmationNumber: result.confirmationNumber,
                        expectedProcessingDays: result.metadata.expectedProcessingDays || 14
                    },
                    specialtyWorkflow: {
                        specialty,
                        workflowUsed: true,
                        validationResult: result.validationResult,
                        nextSteps: result.nextSteps
                    }
                }
            };
        }

        // Fallback to original mock logic for backward compatibility
        const claimId = event.claimId || `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const submissionResult = {
            claimId,
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            payerResponse: {
                confirmationNumber: `CONF-${Math.random().toString(36).substring(2, 9)}`,
                expectedProcessingDays: Math.floor(Math.random() * 30) + 1
            }
        };

        return {
            statusCode: 200,
            body: {
                claimId,
                patientId,
                serviceCode,
                providerId,
                amount,
                ...submissionResult,
                specialtyWorkflow: {
                    workflowUsed: false,
                    reason: 'No specialty or organizationId provided'
                }
            }
        };
    } catch (error) {
        console.error('Error submitting claim:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to submit claim',
                details: error.message
            }
        };
    }
};

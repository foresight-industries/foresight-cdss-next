interface ClaimStatusEvent {
    claimId: string;
    amount?: number;
}

interface ClaimStatusResponse {
    claimId: string;
    status: string;
    checkedAt: string;
    paidAmount?: number;
    paidDate?: string;
    denialReason?: string;
    appealDeadline?: string;
    reviewNotes?: string;
}

export default async (event: ClaimStatusEvent) => {
    console.log('Check claim status workflow: claimId=%s', event.claimId);

    try {
        // Mock claim status check logic
        const { claimId } = event;

        // Simulate different claim statuses
        const statuses = ['pending', 'paid', 'denied', 'under_review'] as const;
        const weights = [0.3, 0.5, 0.15, 0.05]; // 30% pending, 50% paid, 15% denied, 5% under review

        const random = Math.random();
        let status = '';
        let cumulative = 0;

        for (let i = 0; i < statuses.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                status = statuses[i];
                break;
            }
        }

        // Fallback to last status if none selected (should not happen with proper weights)
        if (!status) {
            status = statuses[statuses.length - 1];
        }

        const response: ClaimStatusResponse = {
            claimId,
            status,
            checkedAt: new Date().toISOString()
        };

        // Add status-specific details
        switch (status) {
            case 'paid':
                response.paidAmount = event.amount || Math.floor(Math.random() * 1000) + 100;
                response.paidDate = new Date().toISOString();
                break;
            case 'denied':
                response.denialReason = 'Service not covered under current plan';
                response.appealDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case 'under_review':
                response.reviewNotes = 'Additional documentation required';
                break;
        }

        return {
            statusCode: 200,
            body: response
        };
    } catch (error: any) {
        console.error('Error checking claim status:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to check claim status',
                details: error.message
            }
        };
    }
};

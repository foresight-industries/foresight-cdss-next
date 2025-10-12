exports.handler = async (event) => {
    console.log('Process payment event:', JSON.stringify(event, null, 2));
    
    try {
        // Mock payment processing logic
        const { claimId, paidAmount, patientId, providerId } = event;
        
        // Generate payment ID
        const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate payment allocation
        const allocation = {
            paymentId,
            claimId,
            totalAmount: paidAmount,
            providerAmount: paidAmount * 0.8, // 80% to provider
            patientResponsibility: paidAmount * 0.2, // 20% patient responsibility
            processedAt: new Date().toISOString(),
            status: 'processed'
        };
        
        // Simulate line item matching for ERA processing
        const matched = Math.random() > 0.1; // 90% match rate
        
        return {
            statusCode: 200,
            body: {
                paymentId,
                claimId,
                patientId,
                providerId,
                matched,
                allocation,
                status: 'completed'
            }
        };
    } catch (error) {
        console.error('Error processing payment:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to process payment',
                details: error.message
            }
        };
    }
};
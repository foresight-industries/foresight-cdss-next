exports.handler = async (event) => {
    console.log('Send notification workflow: type=%s claimId=%s', event.type, event.claimId);
    
    try {
        // Mock notification sending logic
        const { type, recipient, claimId, patientId, message } = event;
        
        // Generate notification ID
        const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate different notification types
        const notificationTypes = {
            payment: {
                subject: `Payment Processed - Claim ${claimId}`,
                template: 'payment_confirmation'
            },
            denial: {
                subject: `Claim Denied - Claim ${claimId}`,
                template: 'claim_denial'
            },
            authorization: {
                subject: `Prior Authorization Update - ${claimId}`,
                template: 'prior_auth_update'
            },
            appeal: {
                subject: `Appeal Created - Claim ${claimId}`,
                template: 'appeal_created'
            }
        };
        
        const notificationConfig = notificationTypes[type] || {
            subject: `RCM Notification - ${claimId}`,
            template: 'general'
        };
        
        // Simulate sending notification
        const deliveryResult = {
            notificationId,
            type,
            recipient,
            subject: notificationConfig.subject,
            template: notificationConfig.template,
            sentAt: new Date().toISOString(),
            status: 'delivered',
            deliveryMethod: recipient.includes('@') ? 'email' : 'sms'
        };
        
        return {
            statusCode: 200,
            body: {
                notificationId,
                claimId,
                patientId,
                message: message || `Notification sent successfully to ${recipient}`,
                ...deliveryResult
            }
        };
    } catch (error) {
        console.error('Error sending notification:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Failed to send notification',
                details: error.message
            }
        };
    }
};
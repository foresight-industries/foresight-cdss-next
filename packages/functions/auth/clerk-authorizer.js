const { Clerk } = require('@clerk/clerk-sdk-node');

// Initialize Clerk
const clerk = Clerk({
    secretKey: process.env.CLERK_SECRET_KEY,
});

exports.handler = async (event) => {
    console.log(
        'Authorizer request: methodArn=%s requestId=%s',
        event.methodArn,
        event.requestContext?.requestId || 'unknown'
    );
    
    try {
        const { authorizationToken, methodArn } = event;
        
        if (!authorizationToken) {
            throw new Error('Unauthorized: Missing authorization token');
        }
        
        // Extract Bearer token
        const token = authorizationToken.replace('Bearer ', '');
        
        // Verify the JWT token with Clerk
        const session = await clerk.sessions.verifySession(token);
        
        if (!session) {
            throw new Error('Unauthorized: Invalid session');
        }
        
        // Get user information
        const user = await clerk.users.getUser(session.userId);
        
        // Generate policy
        const policy = generatePolicy(session.userId, 'Allow', methodArn, {
            userId: session.userId,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.publicMetadata?.organizationId
        });
        
        console.log('Authorization successful for user:', session.userId);
        return policy;
        
    } catch (error) {
        console.error('Authorization failed:', error);
        throw new Error('Unauthorized');
    }
};

function generatePolicy(principalId, effect, resource, context = {}) {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context,
    };
}
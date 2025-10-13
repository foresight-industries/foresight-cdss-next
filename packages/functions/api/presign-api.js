const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log(
        'Presign API request received: method=%s resource=%s requestId=%s',
        event.httpMethod,
        event.resource || event.rawPath,
        event.requestContext?.requestId
    );

    try {
        const { httpMethod, queryStringParameters, body } = event;

        // Extract user context from authorizer
        const { userId, organizationId } = event.requestContext.authorizer;

        let response;

        switch (httpMethod) {
          case "POST": {
            const requestData = JSON.parse(body);
            response = await generatePresignedUrl(
              requestData,
              organizationId,
              userId
            );
            break;
          }
          default:
            throw new Error(`Unsupported method: ${httpMethod}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: JSON.stringify(response),
        };

    } catch (error) {
        console.error('Presign API error:', error);
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

async function generatePresignedUrl(requestData, organizationId, userId) {
    const { fileName, fileType, operation = 'putObject', expiresIn = 3600 } = requestData;

    if (!fileName || !fileType) {
        throw new Error('fileName and fileType are required');
    }

    // Generate secure file key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileKey = `${organizationId}/${userId}/${timestamp}-${randomString}-${fileName}`;

    const bucketName = process.env.DOCUMENTS_BUCKET;
    if (!bucketName) {
        throw new Error('Documents bucket not configured');
    }

    let presignedUrl;
    let method;

    try {
        switch (operation) {
            case 'putObject':
                // Generate URL for uploading
                presignedUrl = await s3.getSignedUrlPromise('putObject', {
                    Bucket: bucketName,
                    Key: fileKey,
                    ContentType: fileType,
                    Expires: expiresIn,
                    Metadata: {
                        'uploaded-by': userId,
                        'organization-id': organizationId,
                        'original-filename': fileName
                    }
                });
                method = 'PUT';
                break;

            case 'getObject':
                // Generate URL for downloading
                presignedUrl = await s3.getSignedUrlPromise('getObject', {
                    Bucket: bucketName,
                    Key: fileKey,
                    Expires: expiresIn
                });
                method = 'GET';
                break;

            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
            presignedUrl,
            fileKey,
            method,
            expiresIn,
            uploadMetadata: operation === 'putObject' ? {
                'Content-Type': fileType,
                'x-amz-meta-uploaded-by': userId,
                'x-amz-meta-organization-id': organizationId,
                'x-amz-meta-original-filename': fileName
            } : undefined
        };

    } catch (error) {
        console.error('S3 presigning error:', error);
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
}

// Helper function to validate file types
function isValidFileType(fileType, allowedTypes = []) {
    const defaultAllowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const types = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;
    return types.includes(fileType);
}

// Helper function to validate file size (can be used in frontend)
function getMaxFileSize(fileType) {
    // Return max file size in bytes
    const imageSizeLimit = 10 * 1024 * 1024; // 10MB for images
    const documentSizeLimit = 50 * 1024 * 1024; // 50MB for documents

    if (fileType.startsWith('image/')) {
        return imageSizeLimit;
    }

    return documentSizeLimit;
}

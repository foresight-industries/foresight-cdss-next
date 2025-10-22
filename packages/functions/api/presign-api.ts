import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });

interface PresignRequest {
    fileName: string;
    fileType: string;
    operation?: 'putObject' | 'getObject';
    expiresIn?: number;
    fileSize?: number;
}

interface PresignResponse {
    presignedUrl: string;
    fileKey: string;
    method: string;
    expiresIn: number;
    uploadMetadata?: Record<string, string>;
}

export const handler = async (event: any) => {
    console.log(
        'Presign API request received: method=%s resource=%s requestId=%s',
        event.httpMethod,
        event.resource || event.rawPath,
        event.requestContext?.requestId
    );

    try {
        const { httpMethod, body } = event;

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
        const err = error as any;
        return {
            statusCode: err.statusCode || 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: err.message || 'Internal server error',
            }),
        };
    }
};

async function generatePresignedUrl(requestData: PresignRequest, organizationId: string, userId: string): Promise<PresignResponse> {
    const { fileName, fileType, operation = 'putObject', expiresIn = 3600, fileSize } = requestData;

    if (!fileName || !fileType) {
        throw new Error('fileName and fileType are required');
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
        throw new Error(`File type '${fileType}' is not allowed`);
    }

    // Validate file size if provided
    if (fileSize && fileSize > getMaxFileSize(fileType)) {
        throw new Error(`File size exceeds maximum allowed size for ${fileType}`);
    }

    // Generate secure file key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileKey = `${organizationId}/${userId}/${timestamp}-${randomString}-${fileName}`;

    const bucketName = process.env.DOCUMENTS_BUCKET;
    if (!bucketName) {
        throw new Error('Documents bucket not configured');
    }

    let presignedUrl: string;
    let method: string;

    try {
        switch (operation) {
            case 'putObject': {
                // Create PutObjectCommand with metadata
                const putCommand = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: fileKey,
                    ContentType: fileType,
                    Metadata: {
                        'uploaded-by': userId,
                        'organization-id': organizationId,
                        'original-filename': fileName
                    }
                });

                presignedUrl = await getSignedUrl(s3, putCommand, { expiresIn });
                method = 'PUT';
                break;
            }

            case 'getObject': {
                // Create GetObjectCommand for downloading
                const getCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileKey
                });

                presignedUrl = await getSignedUrl(s3, getCommand, { expiresIn });
                method = 'GET';
                break;
            }

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

    } catch (error: any) {
        console.error('S3 presigning error:', error);
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
}

// Helper function to validate file types
function isValidFileType(fileType: string, allowedTypes: string[] = []): boolean {
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
function getMaxFileSize(fileType: string): number {
    // Return max file size in bytes
    const imageSizeLimit = 10 * 1024 * 1024; // 10MB for images
    const documentSizeLimit = 50 * 1024 * 1024; // 50MB for documents

    if (fileType.startsWith('image/')) {
        return imageSizeLimit;
    }

    return documentSizeLimit;
}

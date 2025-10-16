import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, type _Object } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCurrentUser } from './database';

/**
 * AWS S3 Storage Client
 * Replaces Supabase Storage with AWS S3
 */

// Environment validation
if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required');
}

if (!process.env.DOCUMENTS_BUCKET_NAME) {
  throw new Error('DOCUMENTS_BUCKET_NAME environment variable is required');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET_NAME;

/**
 * Generate secure file path with team/user context
 */
function generateFilePath(bucket: string, fileName: string, teamId?: string | null, userId?: string | null): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  
  // Create path with team/user context for security
  let basePath = 'public';
  
  if (teamId && userId) {
    basePath = `teams/${teamId}/users/${userId}`;
  } else if (teamId) {
    basePath = `teams/${teamId}/shared`;
  } else if (userId) {
    basePath = `users/${userId}`;
  }
  
  return `${basePath}/${timestamp}_${randomSuffix}_${sanitizedFileName}`;
}

/**
 * Upload file to S3
 * This replaces supabase.storage.from().upload()
 */
export async function uploadFile(
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer | Uint8Array,
  contentType?: string,
  isPublic = false
): Promise<{ data: { path: string; fullUrl: string } | null; error: Error | null }> {
  try {
    const user = await getCurrentUser();
    const filePath = generateFilePath(bucketName, fileName, user?.teamId, user?.userId);

    const command = new PutObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream',
      Metadata: {
        'uploaded-by': user?.userId || 'anonymous',
        'team-id': user?.teamId || 'none',
        'upload-timestamp': new Date().toISOString(),
      },
      // Set public read if specified
      ...(isPublic && { ACL: 'public-read' }),
    });

    await s3Client.send(command);

    const fullUrl = isPublic 
      ? `https://${DOCUMENTS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`
      : await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: DOCUMENTS_BUCKET,
          Key: filePath,
        }), { expiresIn: 3600 }); // 1 hour expiry

    return {
      data: {
        path: filePath,
        fullUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Upload failed'),
    };
  }
}

/**
 * Download file from S3
 * This replaces supabase.storage.from().download()
 */
export async function downloadFile(
  bucketName: string,
  filePath: string
): Promise<{ data: Buffer | null; error: Error | null }> {
  try {
    const command = new GetObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: filePath,
    });

    const response = await s3Client.send(command);
    
    if (response.Body) {
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const buffer = Buffer.concat(chunks);
      return { data: buffer, error: null };
    }

    return { data: null, error: new Error('Empty response body') };
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Download failed'),
    };
  }
}

/**
 * Get signed URL for secure file access
 * This replaces supabase.storage.from().createSignedUrl()
 */
export async function createSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn = 3600
): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
  try {
    const command = new GetObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      data: { signedUrl },
      error: null,
    };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Signed URL creation failed'),
    };
  }
}

/**
 * Delete file from S3
 * This replaces supabase.storage.from().remove()
 */
export async function deleteFile(
  bucketName: string,
  filePath: string
): Promise<{ data: null; error: Error | null }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: filePath,
    });

    await s3Client.send(command);

    return { data: null, error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Delete failed'),
    };
  }
}

/**
 * List files in S3 bucket
 * This replaces supabase.storage.from().list()
 */
export async function listFiles(
  bucketName: string,
  prefix = '',
  limit = 100
): Promise<{ data: Array<{ name: string; id: string; size: number; lastModified: Date }> | null; error: Error | null }> {
  try {
    const user = await getCurrentUser();
    
    // Ensure user can only list their team's files
    let actualPrefix = prefix;
    if (user?.teamId) {
      actualPrefix = prefix ? `teams/${user.teamId}/${prefix}` : `teams/${user.teamId}/`;
    }

    const command = new ListObjectsV2Command({
      Bucket: DOCUMENTS_BUCKET,
      Prefix: actualPrefix,
      MaxKeys: limit,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((object: _Object) => ({
      name: object.Key?.split('/').pop() || '',
      id: object.Key || '',
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }));

    return { data: files, error: null };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('List failed'),
    };
  }
}

/**
 * Storage bucket interface that mimics Supabase API
 */
export class StorageBucket {
  constructor(private bucketName: string) {}

  /**
   * Upload file to bucket
   */
  async upload(
    path: string,
    file: File | Buffer | Uint8Array,
    options?: { contentType?: string; upsert?: boolean }
  ) {
    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer())
      : file instanceof Buffer 
        ? file 
        : Buffer.from(file);

    const contentType = options?.contentType || 
      (file instanceof File ? file.type : undefined);

    return uploadFile(this.bucketName, path, buffer, contentType);
  }

  /**
   * Download file from bucket
   */
  async download(path: string) {
    return downloadFile(this.bucketName, path);
  }

  /**
   * Create signed URL
   */
  async createSignedUrl(path: string, expiresIn?: number) {
    return createSignedUrl(this.bucketName, path, expiresIn);
  }

  /**
   * Delete files from bucket
   */
  async remove(paths: string[]) {
    const results = await Promise.all(
      paths.map(path => deleteFile(this.bucketName, path))
    );

    const errors = results.filter(result => result.error);
    
    return {
      data: errors.length === 0,
      error: errors.length > 0 ? errors[0].error : null,
    };
  }

  /**
   * List files in bucket
   */
  async list(path?: string, options?: { limit?: number }) {
    return listFiles(this.bucketName, path, options?.limit);
  }
}

/**
 * Storage client that mimics Supabase storage API
 * This replaces supabase.storage
 */
export class StorageClient {
  /**
   * Get storage bucket
   * This replaces supabase.storage.from()
   */
  from(bucketName: string): StorageBucket {
    return new StorageBucket(bucketName);
  }
}

// Export singleton storage client
export const storage = new StorageClient();

// Helper function to get documents bucket
export const documents = storage.from('documents');

// Export S3 client for advanced use cases
export { s3Client };
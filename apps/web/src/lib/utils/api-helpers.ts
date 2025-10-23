import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from '@/lib/types/api';

/**
 * Standardized error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: string,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ApiError> {
  const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
  return createErrorResponse(
    'Validation failed',
    400,
    issues.join(', '),
    'VALIDATION_ERROR'
  );
}

/**
 * Handle file validation errors
 */
export function createFileValidationError(
  fileName: string,
  reason: string
): { fileName: string; error: string } {
  return { fileName, error: reason };
}

/**
 * Standardized success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Middleware for authentication check
 */
export function requireAuth(userId: string | null): NextResponse<ApiError> | null {
  if (!userId) {
    return createErrorResponse('Unauthorized', 401, 'Authentication required', 'AUTH_REQUIRED');
  }
  return null;
}

/**
 * Middleware for validating environment variables
 */
export function validateEnvironment(requiredVars: string[]): string | null {
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      return `Missing required environment variable: ${varName}`;
    }
  }
  return null;
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < windowStart) {
    // First request in window or expired window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, resetTime: now + windowMs };
  }
  
  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, resetTime: current.resetTime };
  }
  
  // Increment count
  current.count++;
  return { allowed: true, resetTime: current.resetTime };
}

/**
 * S3 upload metadata helper
 */
export function createS3Metadata(
  uploadId: string,
  userId: string,
  additionalMetadata: Record<string, string> = {}
): Record<string, string> {
  return {
    uploadId,
    userId,
    uploadTimestamp: Date.now().toString(),
    ...additionalMetadata,
  };
}

/**
 * Log structured API request
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  userId: string | null,
  metadata?: Record<string, any>
): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    userId: userId || 'anonymous',
    ...metadata,
  }));
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiError>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API route error:', error);
      
      if (error instanceof ZodError) {
        return handleValidationError(error);
      }
      
      if (error instanceof Error) {
        return createErrorResponse(
          'Internal server error',
          500,
          error.message,
          'INTERNAL_ERROR'
        );
      }
      
      return createErrorResponse(
        'Unknown server error',
        500,
        'An unexpected error occurred',
        'UNKNOWN_ERROR'
      );
    }
  };
}

/**
 * CORS headers for API responses
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Content-Type validation for multipart uploads
 */
export function validateContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith('multipart/form-data');
}
// Shared API types for document upload endpoints

export interface BaseUploadResponse {
  success: boolean;
  message: string;
}

export interface InsuranceCardUploadResponse extends BaseUploadResponse {
  uploadId: string;
  s3Key: string;
  processingStatus: 'initiated' | 'validating' | 'processing' | 'completed' | 'failed';
}

export interface InsuranceCardStatusResponse {
  uploadId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedData?: {
    policyNumber?: string;
    groupNumber?: string;
    planName?: string;
    payerName?: string;
    subscriberName?: string;
    memberId?: string;
    effectiveDate?: string;
    copays?: {
      pcp?: string;
      specialist?: string;
      er?: string;
      urgentCare?: string;
    };
    deductible?: string;
    outOfPocketMax?: string;
    pharmacy?: {
      bin?: string;
      pcn?: string;
      group?: string;
    };
  };
  validationResult?: {
    isValid: boolean;
    confidence: number;
    issues: string[];
    metadata?: {
      textConfidence?: number;
      documentQuality?: 'high' | 'medium' | 'low';
      suspiciousContent?: boolean;
    };
  };
  error?: string;
}

export interface FileUploadResult {
  fileName: string;
  s3Key: string;
  uploadId: string;
  size: number;
  contentType: string;
}

export interface PriorAuthUploadResponse extends BaseUploadResponse {
  priorAuthId: string;
  uploadedFiles: FileUploadResult[];
  failedFiles: { fileName: string; error: string; }[];
  totalFiles: number;
}

export interface PriorAuthDocumentsResponse {
  priorAuthId: string;
  documents: {
    uploadId: string;
    fileName: string;
    documentType: string;
    description?: string;
    uploadedAt: string;
    size: number;
    contentType: string;
    s3Key: string;
  }[];
  totalCount: number;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

// Document upload constraints
export const UPLOAD_CONSTRAINTS = {
  INSURANCE_CARD: {
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'],
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 2, // front and back
  },
  PRIOR_AUTH: {
    ALLOWED_TYPES: [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/heic',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    MAX_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_FILES: 10,
  },
} as const;

// Document types for prior auth
export const PRIOR_AUTH_DOCUMENT_TYPES = [
  'clinical_notes',
  'lab_results', 
  'imaging_reports',
  'physician_letter',
  'medical_records',
  'prescription',
  'treatment_plan',
  'other'
] as const;

export type PriorAuthDocumentType = typeof PRIOR_AUTH_DOCUMENT_TYPES[number];

// Validation utilities
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize && file.size > 0;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// S3 key generators
export function generateInsuranceCardS3Key(
  patientId: string,
  organizationId: string,
  cardSide: 'front' | 'back',
  fileName: string
): string {
  const timestamp = Date.now();
  const uploadId = crypto.randomUUID();
  const fileExtension = fileName.split('.').pop() || 'unknown';
  return `insurance-cards/${patientId}/${organizationId}/${cardSide}-${timestamp}-${uploadId}.${fileExtension}`;
}

export function generatePriorAuthDocumentS3Key(
  priorAuthId: string,
  organizationId: string,
  documentType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const uploadId = crypto.randomUUID();
  const sanitizedFileName = sanitizeFileName(fileName);
  return `prior-auth-docs/${priorAuthId}/${organizationId}/${documentType}/${timestamp}-${uploadId}-${sanitizedFileName}`;
}
import {
  RekognitionClient,
  DetectTextCommand,
  DetectModerationLabelsCommand,
  DetectFacesCommand,
  DetectTextCommandInput,
  DetectModerationLabelsCommandInput,
  DetectFacesCommandInput
} from '@aws-sdk/client-rekognition';

type DocumentQualityClassification = 'high' | 'medium' | 'low';

const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  metadata?: {
    textConfidence?: number;
    faceDetected?: boolean;
    documentQuality?: DocumentQualityClassification;
    suspiciousContent?: boolean;
  };
}

export interface DocumentValidationOptions {
  bucket: string;
  key: string;
  documentType: 'insurance_card' | 'medical_document' | 'id_card' | 'general';
  minTextConfidence?: number;
  checkForFaces?: boolean;
  checkForInappropriateContent?: boolean;
  validateDocumentStructure?: boolean;
}

/**
 * Comprehensive document validation using Amazon Rekognition
 */
export async function validateDocument(options: DocumentValidationOptions): Promise<ValidationResult> {
  const {
    bucket,
    key,
    documentType,
    minTextConfidence = 80,
    checkForFaces = false,
    checkForInappropriateContent = true,
    validateDocumentStructure = true
  } = options;

  const issues: string[] = [];
  let overallConfidence = 100;
  let metadata: ValidationResult['metadata'] = {};

  const s3Object = {
    Bucket: bucket,
    Name: key,
  };

  try {
    // 1. Text Detection and Quality Assessment
    if (validateDocumentStructure) {
      const textValidation = await validateTextContent(s3Object, minTextConfidence, documentType);
      if (!textValidation.isValid) {
        issues.push(...textValidation.issues);
        overallConfidence = Math.min(overallConfidence, textValidation.confidence);
      }
      metadata.textConfidence = textValidation.confidence;
      metadata.documentQuality = textValidation.quality;
    }

    // 2. Face Detection (for ID verification)
    if (checkForFaces) {
      const faceValidation = await validateFacePresence(s3Object, documentType);
      if (!faceValidation.isValid) {
        issues.push(...faceValidation.issues);
        overallConfidence = Math.min(overallConfidence, faceValidation.confidence);
      }
      metadata.faceDetected = faceValidation.faceFound;
    }

    // 3. Content Moderation (inappropriate content detection)
    if (checkForInappropriateContent) {
      const contentValidation = await validateContentModeration(s3Object);
      if (!contentValidation.isValid) {
        issues.push(...contentValidation.issues);
        overallConfidence = Math.min(overallConfidence, contentValidation.confidence);
        metadata.suspiciousContent = true;
      }
    }

    // 4. Document-specific validation
    const specificValidation = await validateDocumentSpecifics(s3Object, documentType);
    if (!specificValidation.isValid) {
      issues.push(...specificValidation.issues);
      overallConfidence = Math.min(overallConfidence, specificValidation.confidence);
    }

    return {
      isValid: issues.length === 0,
      confidence: overallConfidence,
      issues,
      metadata
    };

  } catch (error) {
    console.error('Rekognition validation error:', error);
    return {
      isValid: false,
      confidence: 0,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      metadata
    };
  }
}

/**
 * Validate text content and document quality
 */
async function validateTextContent(
  s3Object: { Bucket: string; Name: string },
  minConfidence: number,
  documentType: string
): Promise<{ isValid: boolean; confidence: number; issues: string[]; quality: 'high' | 'medium' | 'low' }> {
  const issues: string[] = [];

  try {
    const params: DetectTextCommandInput = {
      Image: { S3Object: s3Object }
    };

    const response = await rekognitionClient.send(new DetectTextCommand(params));

    if (!response.TextDetections || response.TextDetections.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        issues: ['No text detected in document'],
        quality: 'low'
      };
    }

    // Calculate average confidence
    const textDetections = response.TextDetections.filter(detection => detection.Type === 'WORD' && detection.Confidence);
    if (textDetections.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        issues: ['No readable text found'],
        quality: 'low'
      };
    }

    const avgConfidence = textDetections.reduce((sum, detection) => sum + (detection.Confidence || 0), 0) / textDetections.length;

    // Determine document quality
    let quality: 'high' | 'medium' | 'low' = 'low';
    if (avgConfidence >= 90) quality = 'high';
    else if (avgConfidence >= 75) quality = 'medium';

    // Check minimum confidence threshold
    if (avgConfidence < minConfidence) {
      issues.push(`Text confidence ${avgConfidence.toFixed(1)}% below threshold ${minConfidence}%`);
    }

    // Check for minimum text content based on document type
    const wordCount = textDetections.length;
    const minWords = getMinimumWordCount(documentType);
    if (wordCount < minWords) {
      issues.push(`Insufficient text content: ${wordCount} words (minimum: ${minWords})`);
    }

    return {
      isValid: issues.length === 0,
      confidence: avgConfidence,
      issues,
      quality
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 0,
      issues: [`Text validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      quality: 'low'
    };
  }
}

/**
 * Validate face presence for ID documents
 */
async function validateFacePresence(
  s3Object: { Bucket: string; Name: string },
  documentType: string
): Promise<{ isValid: boolean; confidence: number; issues: string[]; faceFound: boolean }> {
  const issues: string[] = [];

  try {
    const params: DetectFacesCommandInput = {
      Image: { S3Object: s3Object },
      Attributes: ['ALL']
    };

    const response = await rekognitionClient.send(new DetectFacesCommand(params));
    const faces = response.FaceDetails || [];

    // For insurance cards, face is optional
    // For ID cards, face is typically required
    const expectsFace = documentType === 'id_card';

    if (expectsFace && faces.length === 0) {
      issues.push('No face detected on ID document');
      return { isValid: false, confidence: 0, issues, faceFound: false };
    }

    if (faces.length > 1) {
      issues.push(`Multiple faces detected: ${faces.length}`);
      return { isValid: false, confidence: 60, issues, faceFound: true };
    }

    // Check face quality if present
    if (faces.length === 1) {
      const face = faces[0];
      const confidence = face.Confidence || 0;

      if (confidence < 90) {
        issues.push(`Low face detection confidence: ${confidence.toFixed(1)}%`);
      }

      // Check for face quality indicators
      if (face.Quality) {
        if ((face.Quality.Brightness || 0) < 30) {
          issues.push('Image too dark for face verification');
        }
        if ((face.Quality.Sharpness || 0) < 30) {
          issues.push('Image too blurry for face verification');
        }
      }
    }

    return {
      isValid: issues.length === 0,
      confidence: faces.length > 0 ? (faces[0].Confidence || 0) : 100,
      issues,
      faceFound: faces.length > 0
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 0,
      issues: [`Face detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      faceFound: false
    };
  }
}

/**
 * Check for inappropriate or suspicious content
 */
async function validateContentModeration(
  s3Object: { Bucket: string; Name: string }
): Promise<{ isValid: boolean; confidence: number; issues: string[] }> {
  const issues: string[] = [];

  try {
    const params: DetectModerationLabelsCommandInput = {
      Image: { S3Object: s3Object },
      MinConfidence: 75
    };

    const response = await rekognitionClient.send(new DetectModerationLabelsCommand(params));
    const moderationLabels = response.ModerationLabels || [];

    // Flag any inappropriate content
    const problematicLabels = moderationLabels.filter(label =>
      (label.Confidence || 0) > 75 &&
      !isAcceptableForMedicalDocuments(label.Name || '')
    );

    if (problematicLabels.length > 0) {
      const labelNames = problematicLabels.map(label => label.Name).join(', ');
      issues.push(`Inappropriate content detected: ${labelNames}`);
    }

    return {
      isValid: issues.length === 0,
      confidence: issues.length === 0 ? 100 : 0,
      issues
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 0,
      issues: [`Content moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Document-specific validation rules
 */
async function validateDocumentSpecifics(
  s3Object: { Bucket: string; Name: string },
  documentType: string
): Promise<{ isValid: boolean; confidence: number; issues: string[] }> {
  const issues: string[] = [];

  try {
    // Get basic text for pattern validation
    const params: DetectTextCommandInput = {
      Image: { S3Object: s3Object }
    };

    const response = await rekognitionClient.send(new DetectTextCommand(params));
    const textDetections = response.TextDetections || [];
    const detectedText = textDetections
      .filter(detection => detection.Type === 'WORD')
      .map(detection => detection.DetectedText || '')
      .join(' ')
      .toLowerCase();

    // Document-specific validation
    switch (documentType) {
      case 'insurance_card':
        if (!hasInsuranceCardIndicators(detectedText)) {
          issues.push('Document does not appear to be an insurance card');
        }
        break;

      case 'id_card':
        if (!hasIdCardIndicators(detectedText)) {
          issues.push('Document does not appear to be a valid ID');
        }
        break;

      case 'medical_document':
        if (!hasMedicalDocumentIndicators(detectedText)) {
          issues.push('Document does not appear to be a medical document');
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      confidence: issues.length === 0 ? 95 : 30,
      issues
    };

  } catch (error) {
    console.error('Document-specific validation error:', error);
    return {
      isValid: true, // Don't fail validation if specific checks fail
      confidence: 80,
      issues: []
    };
  }
}

/**
 * Helper functions
 */
function getMinimumWordCount(documentType: string): number {
  switch (documentType) {
    case 'insurance_card': return 8;
    case 'id_card': return 5;
    case 'medical_document': return 10;
    default: return 5;
  }
}

function isAcceptableForMedicalDocuments(labelName: string): boolean {
  // Allow certain labels that might appear in legitimate medical contexts
  const acceptableLabels = [
    'Medical Procedure',
    'Medical Equipment',
    'Surgery',
    'Healthcare'
  ];
  return acceptableLabels.includes(labelName);
}

function hasInsuranceCardIndicators(text: string): boolean {
  const indicators = [
    'insurance', 'policy', 'member', 'group', 'copay', 'deductible',
    'coverage', 'plan', 'subscriber', 'effective', 'id', 'rx', 'pharmacy'
  ];
  return indicators.some(indicator => text.includes(indicator));
}

function hasIdCardIndicators(text: string): boolean {
  const indicators = [
    'license', 'identification', 'state', 'expires', 'date of birth',
    'dob', 'address', 'id', 'card', 'issued'
  ];
  return indicators.some(indicator => text.includes(indicator));
}

function hasMedicalDocumentIndicators(text: string): boolean {
  const indicators = [
    'patient', 'doctor', 'physician', 'medical', 'diagnosis', 'treatment',
    'prescription', 'medication', 'clinic', 'hospital', 'health'
  ];
  return indicators.some(indicator => text.includes(indicator));
}

/**
 * Quick validation for high-volume processing
 */
export async function quickValidateDocument(
  bucket: string,
  key: string
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const params: DetectTextCommandInput = {
      Image: {
        S3Object: { Bucket: bucket, Name: key }
      }
    };

    const response = await rekognitionClient.send(new DetectTextCommand(params));

    if (!response.TextDetections || response.TextDetections.length === 0) {
      return { isValid: false, reason: 'No text detected' };
    }

    const wordDetections = response.TextDetections.filter(d => d.Type === 'WORD');
    if (wordDetections.length < 3) {
      return { isValid: false, reason: 'Insufficient text content' };
    }

    const avgConfidence = wordDetections.reduce((sum, d) => sum + (d.Confidence || 0), 0) / wordDetections.length;
    if (avgConfidence < 70) {
      return { isValid: false, reason: `Low text quality: ${avgConfidence.toFixed(1)}%` };
    }

    return { isValid: true };

  } catch (error) {
    console.error('Quick validation error:', error);
    return { isValid: false, reason: 'Validation service error' };
  }
}

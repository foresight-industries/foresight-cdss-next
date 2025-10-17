import { 
  ComprehendMedicalClient, 
  DetectEntitiesV2Command
} from '@aws-sdk/client-comprehendmedical';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

interface DenialReason {
  category: string;
  specific_reason: string;
  auto_retry_possible: boolean;
  correction_strategy: string;
  confidence: number;
}

interface RetryStrategy {
  action: string;
  description: string;
  required_changes: string[];
  estimated_success_probability: number;
}

interface DenialAnalysisResult {
  priorAuthId: string;
  denial_text: string;
  denial_reasons: DenialReason[];
  primary_denial_category: string;
  auto_retry_possible: boolean;
  retry_count: number;
  retry_strategies: RetryStrategy[];
  recommended_action: 'auto_retry' | 'manual_review' | 'abandon';
  confidence_score: number;
}

const comprehendMedical = new ComprehendMedicalClient({ 
  region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' 
});
const rdsClient = new RDSDataClient({ region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' });

// Common denial reason patterns and their retry strategies
const DENIAL_PATTERNS = {
  'MISSING_DOCUMENTATION': {
    keywords: ['missing', 'insufficient', 'documentation', 'records', 'notes', 'not provided'],
    auto_retry_possible: true,
    correction_strategy: 'REQUEST_ADDITIONAL_DOCS',
    success_probability: 85
  },
  'MEDICAL_NECESSITY': {
    keywords: ['medical necessity', 'not medically necessary', 'experimental', 'investigational'],
    auto_retry_possible: true,
    correction_strategy: 'ENHANCE_MEDICAL_JUSTIFICATION',
    success_probability: 70
  },
  'INCORRECT_CODING': {
    keywords: ['incorrect code', 'invalid code', 'coding error', 'wrong procedure'],
    auto_retry_possible: true,
    correction_strategy: 'CORRECT_CODES',
    success_probability: 90
  },
  'PRIOR_AUTHORIZATION_REQUIRED': {
    keywords: ['prior authorization required', 'PA required', 'preauthorization'],
    auto_retry_possible: false,
    correction_strategy: 'SUBMIT_PRIOR_AUTH',
    success_probability: 95
  },
  'ELIGIBILITY_ISSUE': {
    keywords: ['not eligible', 'coverage', 'benefits', 'plan exclusion'],
    auto_retry_possible: false,
    correction_strategy: 'VERIFY_ELIGIBILITY',
    success_probability: 30
  },
  'DUPLICATE_CLAIM': {
    keywords: ['duplicate', 'already processed', 'previously paid'],
    auto_retry_possible: false,
    correction_strategy: 'RESEARCH_PREVIOUS_CLAIMS',
    success_probability: 20
  },
  'TIMELY_FILING': {
    keywords: ['timely filing', 'deadline', 'filing limit', 'too late'],
    auto_retry_possible: false,
    correction_strategy: 'APPEAL_FILING_DEADLINE',
    success_probability: 40
  },
  'PROVIDER_ENROLLMENT': {
    keywords: ['provider not enrolled', 'credentialing', 'network'],
    auto_retry_possible: true,
    correction_strategy: 'UPDATE_PROVIDER_INFO',
    success_probability: 75
  }
};

export const handler = async (event: any): Promise<DenialAnalysisResult> => {
  console.log('Analyzing denial reason:', JSON.stringify(event, null, 2));

  try {
    const { priorAuthId, denial_text, retry_count = 0 } = event;
    
    if (!denial_text || denial_text.trim().length < 10) {
      return {
        priorAuthId,
        denial_text: denial_text || '',
        denial_reasons: [],
        primary_denial_category: 'UNKNOWN',
        auto_retry_possible: false,
        retry_count,
        retry_strategies: [],
        recommended_action: 'manual_review',
        confidence_score: 0
      };
    }

    // Step 1: Extract medical entities from denial text to understand context
    console.log('Extracting entities from denial text...');
    const entitiesResponse = await comprehendMedical.send(new DetectEntitiesV2Command({
      Text: denial_text
    }));

    const medicalEntities = entitiesResponse.Entities || [];

    // Step 2: Analyze denial text against known patterns
    const denialReasons: DenialReason[] = [];
    const normalizedText = denial_text.toLowerCase();
    
    for (const [category, pattern] of Object.entries(DENIAL_PATTERNS)) {
      const matchCount = pattern.keywords.reduce((count, keyword) => {
        return count + (normalizedText.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (matchCount > 0) {
        const confidence = Math.min((matchCount / pattern.keywords.length) * 100, 95);
        
        denialReasons.push({
          category,
          specific_reason: pattern.keywords.find(k => normalizedText.includes(k.toLowerCase())) || category,
          auto_retry_possible: pattern.auto_retry_possible,
          correction_strategy: pattern.correction_strategy,
          confidence
        });
      }
    }

    // Step 3: Use medical entities to refine analysis
    const procedureEntities = medicalEntities.filter(entity => 
      entity.Category === 'TREATMENT' || entity.Type === 'PROCEDURE_NAME'
    );
    
    const conditionEntities = medicalEntities.filter(entity => 
      entity.Category === 'MEDICAL_CONDITION'
    );

    // If specific medical procedures are mentioned, it might be a coding issue
    if (procedureEntities.length > 0 && denialReasons.length === 0) {
      denialReasons.push({
        category: 'POSSIBLE_CODING_ISSUE',
        specific_reason: 'Medical procedures mentioned in denial - possible coding discrepancy',
        auto_retry_possible: true,
        correction_strategy: 'REVIEW_PROCEDURE_CODES',
        confidence: 60
      });
    }

    // Step 4: Check denial history for this PA
    let historicalData = null;
    try {
      const historyQuery = `
        SELECT denial_reason, retry_count, resolution_status, created_at
        FROM prior_auth_denials 
        WHERE prior_auth_id = :priorAuthId 
        ORDER BY created_at DESC 
        LIMIT 5
      `;

      const historyResult = await rdsClient.send(new ExecuteStatementCommand({
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: historyQuery,
        parameters: [
          { name: 'priorAuthId', value: { stringValue: priorAuthId } }
        ]
      }));

      if (historyResult.records && historyResult.records.length > 0) {
        historicalData = historyResult.records.map(record => ({
          denial_reason: record[0]?.stringValue || '',
          retry_count: record[1]?.longValue || 0,
          resolution_status: record[2]?.stringValue || '',
          created_at: record[3]?.stringValue || ''
        }));
      }
    } catch (historyError) {
      console.warn('Could not fetch denial history:', historyError);
    }

    // Step 5: Determine primary denial category and overall strategy
    let primaryDenialCategory = 'UNKNOWN';
    let overallAutoRetryPossible = false;
    
    if (denialReasons.length > 0) {
      // Sort by confidence and take the highest
      denialReasons.sort((a, b) => b.confidence - a.confidence);
      primaryDenialCategory = denialReasons[0].category;
      overallAutoRetryPossible = denialReasons[0].auto_retry_possible;
    }

    // Step 6: Generate retry strategies
    const retryStrategies: RetryStrategy[] = [];
    
    for (const reason of denialReasons.filter(r => r.auto_retry_possible)) {
      switch (reason.correction_strategy) {
        case 'REQUEST_ADDITIONAL_DOCS':
          retryStrategies.push({
            action: 'ENHANCE_DOCUMENTATION',
            description: 'Gather and submit additional supporting documentation',
            required_changes: [
              'Request detailed clinical notes from provider',
              'Include diagnostic test results',
              'Add treatment history documentation'
            ],
            estimated_success_probability: 85
          });
          break;
          
        case 'ENHANCE_MEDICAL_JUSTIFICATION':
          retryStrategies.push({
            action: 'STRENGTHEN_MEDICAL_NECESSITY',
            description: 'Provide stronger medical necessity justification',
            required_changes: [
              'Include peer-reviewed literature supporting treatment',
              'Detail failed conservative treatments',
              'Provide physician statement of medical necessity'
            ],
            estimated_success_probability: 70
          });
          break;
          
        case 'CORRECT_CODES':
          retryStrategies.push({
            action: 'FIX_CODING_ERRORS',
            description: 'Correct identified coding errors',
            required_changes: [
              'Review and validate all CPT codes',
              'Verify ICD-10 codes match documentation',
              'Check modifier usage and appropriateness'
            ],
            estimated_success_probability: 90
          });
          break;
          
        case 'UPDATE_PROVIDER_INFO':
          retryStrategies.push({
            action: 'VERIFY_PROVIDER_CREDENTIALS',
            description: 'Update and verify provider information',
            required_changes: [
              'Confirm provider NPI and enrollment status',
              'Verify network participation',
              'Update provider credentials if needed'
            ],
            estimated_success_probability: 75
          });
          break;
      }
    }

    // Step 7: Determine recommended action
    let recommendedAction: 'auto_retry' | 'manual_review' | 'abandon' = 'manual_review';
    
    // Don't auto-retry if we've already tried too many times
    if (retry_count >= 3) {
      recommendedAction = 'abandon';
    } else if (overallAutoRetryPossible && denialReasons[0]?.confidence > 70) {
      // Only auto-retry for high-confidence, correctable issues
      const retryableDenials = ['MISSING_DOCUMENTATION', 'INCORRECT_CODING', 'PROVIDER_ENROLLMENT'];
      if (retryableDenials.includes(primaryDenialCategory)) {
        recommendedAction = 'auto_retry';
      }
    }

    // Step 8: Calculate overall confidence score
    const avgConfidence = denialReasons.length > 0 
      ? denialReasons.reduce((sum, reason) => sum + reason.confidence, 0) / denialReasons.length 
      : 0;
    
    // Adjust confidence based on historical data
    let confidenceScore = avgConfidence;
    if (historicalData && historicalData.length > 0) {
      const successfulRetries = historicalData.filter(h => h.resolution_status === 'approved').length;
      const totalRetries = historicalData.length;
      const historicalSuccessRate = totalRetries > 0 ? successfulRetries / totalRetries : 0;
      
      // Adjust confidence based on historical success
      confidenceScore = (avgConfidence * 0.7) + (historicalSuccessRate * 30);
    }

    // Store denial analysis in database for future reference
    try {
      const insertQuery = `
        INSERT INTO prior_auth_denials 
        (prior_auth_id, denial_reason, denial_category, auto_retry_possible, confidence_score, retry_count, created_at)
        VALUES (:priorAuthId, :denialReason, :denialCategory, :autoRetryPossible, :confidenceScore, :retryCount, NOW())
      `;

      await rdsClient.send(new ExecuteStatementCommand({
        resourceArn: process.env.DATABASE_CLUSTER_ARN,
        secretArn: process.env.DATABASE_SECRET_ARN,
        database: process.env.DATABASE_NAME,
        sql: insertQuery,
        parameters: [
          { name: 'priorAuthId', value: { stringValue: priorAuthId } },
          { name: 'denialReason', value: { stringValue: denial_text } },
          { name: 'denialCategory', value: { stringValue: primaryDenialCategory } },
          { name: 'autoRetryPossible', value: { booleanValue: overallAutoRetryPossible } },
          { name: 'confidenceScore', value: { doubleValue: confidenceScore } },
          { name: 'retryCount', value: { longValue: retry_count } }
        ]
      }));
    } catch (insertError) {
      console.warn('Could not store denial analysis:', insertError);
    }

    const result: DenialAnalysisResult = {
      priorAuthId,
      denial_text,
      denial_reasons: denialReasons,
      primary_denial_category: primaryDenialCategory,
      auto_retry_possible: overallAutoRetryPossible,
      retry_count,
      retry_strategies: retryStrategies,
      recommended_action: recommendedAction,
      confidence_score: confidenceScore
    };

    console.log('Denial analysis completed:', {
      priorAuthId,
      primaryCategory: primaryDenialCategory,
      autoRetryPossible: overallAutoRetryPossible,
      recommendedAction,
      confidenceScore,
      strategiesCount: retryStrategies.length
    });

    return result;

  } catch (error) {
    console.error('Denial analysis error:', error);
    
    return {
      priorAuthId: event.priorAuthId,
      denial_text: event.denial_text || '',
      denial_reasons: [],
      primary_denial_category: 'SYSTEM_ERROR',
      auto_retry_possible: false,
      retry_count: event.retry_count || 0,
      retry_strategies: [],
      recommended_action: 'manual_review',
      confidence_score: 0
    };
  }
};
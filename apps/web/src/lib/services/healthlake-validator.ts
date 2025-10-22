export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
}

export interface QualityMetrics {
  completeness: number; // 0-100 percentage of required fields filled
  consistency: number; // 0-100 consistency across related resources
  accuracy: number; // 0-100 estimated accuracy based on validation rules
  timeliness: number; // 0-100 how recent/up-to-date the data is
  uniqueness: number; // 0-100 absence of duplicates
}

export interface ValidationRuleSet {
  resourceType: string;
  requiredFields: string[];
  optionalFields: string[];
  formatRules: Record<string, RegExp | ((value: any) => boolean)>;
  businessRules: Array<{
    name: string;
    description: string;
    rule: (resource: any) => boolean;
    severity: 'error' | 'warning';
  }>;
  crossResourceRules?: Array<{
    name: string;
    description: string;
    rule: (resource: any, relatedResources: any[]) => boolean;
  }>;
}

export class HealthLakeValidator {
  private rulesets = new Map<string, ValidationRuleSet>();

  constructor() {
    this.initializeDefaultRulesets();
  }

  /**
   * Validate a FHIR resource
   */
  async validateResource(
    resource: any,
    relatedResources?: any[]
  ): Promise<ValidationResult> {
    const resourceType = resource.resourceType;
    const ruleset = this.rulesets.get(resourceType);

    if (!ruleset) {
      return {
        isValid: false,
        errors: [{
          field: 'resourceType',
          code: 'UNSUPPORTED_RESOURCE_TYPE',
          message: `Resource type ${resourceType} is not supported`,
          severity: 'error',
          value: resourceType
        }],
        warnings: [],
        score: 0,
        recommendations: [`Add validation rules for ${resourceType} resource type`]
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];

    // Validate required fields
    const requiredFieldErrors = this.validateRequiredFields(resource, ruleset);
    errors.push(...requiredFieldErrors);

    // Validate field formats
    const formatErrors = this.validateFieldFormats(resource, ruleset);
    errors.push(...formatErrors);

    // Validate business rules
    const businessRuleResults = this.validateBusinessRules(resource, ruleset);
    errors.push(...businessRuleResults.errors);
    warnings.push(...businessRuleResults.warnings);

    // Validate cross-resource rules if related resources provided
    if (relatedResources && ruleset.crossResourceRules) {
      const crossResourceResults = this.validateCrossResourceRules(
        resource,
        relatedResources,
        ruleset
      );
      errors.push(...crossResourceResults.errors);
      warnings.push(...crossResourceResults.warnings);
    }

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(resource, ruleset);
    const qualityScore = this.calculateOverallScore(qualityMetrics);

    // Generate recommendations
    const qualityRecommendations = this.generateQualityRecommendations(
      resource,
      qualityMetrics,
      errors,
      warnings
    );
    recommendations.push(...qualityRecommendations);

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      score: qualityScore,
      recommendations
    };
  }

  /**
   * Batch validate multiple resources
   */
  async validateBatch(resources: any[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    // Group resources by type for cross-validation
    const resourcesByType = new Map<string, any[]>();
    resources.forEach(resource => {
      const type = resource.resourceType;
      if (!resourcesByType.has(type)) {
        resourcesByType.set(type, []);
      }
      resourcesByType.get(type)!.push(resource);
    });

    // Validate each resource
    for (const resource of resources) {
      const resourceId = resource.id || `${resource.resourceType}-${Date.now()}`;
      const relatedResources = this.findRelatedResources(resource, resources);

      const result = await this.validateResource(resource, relatedResources);
      results.set(resourceId, result);
    }

    // Perform batch-level validations
    await this.validateBatchConsistency(results, resourcesByType);

    return results;
  }

  /**
   * Get validation summary for a batch
   */
  getBatchSummary(results: Map<string, ValidationResult>): {
    totalResources: number;
    validResources: number;
    errorCount: number;
    warningCount: number;
    averageScore: number;
    commonIssues: Array<{ issue: string; count: number }>;
  } {
    const values = Array.from(results.values());
    const totalResources = values.length;
    const validResources = values.filter(r => r.isValid).length;
    const errorCount = values.reduce((sum, r) => sum + r.errors.length, 0);
    const warningCount = values.reduce((sum, r) => sum + r.warnings.length, 0);
    const averageScore = values.reduce((sum, r) => sum + r.score, 0) / totalResources;

    // Find common issues
    const issueCounter = new Map<string, number>();
    values.forEach(result => {
      result.errors.forEach(error => {
        const key = `${error.code}: ${error.message}`;
        issueCounter.set(key, (issueCounter.get(key) || 0) + 1);
      });
      result.warnings.forEach(warning => {
        const key = `WARNING: ${warning.message}`;
        issueCounter.set(key, (issueCounter.get(key) || 0) + 1);
      });
    });

    const commonIssues = Array.from(issueCounter.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalResources,
      validResources,
      errorCount,
      warningCount,
      averageScore: Math.round(averageScore * 100) / 100,
      commonIssues
    };
  }

  /**
   * Add or update validation ruleset
   */
  addRuleset(ruleset: ValidationRuleSet): void {
    this.rulesets.set(ruleset.resourceType, ruleset);
  }

  /**
   * Get available resource types
   */
  getSupportedResourceTypes(): string[] {
    return Array.from(this.rulesets.keys());
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(resource: any, ruleset: ValidationRuleSet): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of ruleset.requiredFields) {
      const value = this.getNestedValue(resource, field);

      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing or empty`,
          severity: 'error',
          value
        });
      }
    }

    return errors;
  }

  /**
   * Validate field formats
   */
  private validateFieldFormats(resource: any, ruleset: ValidationRuleSet): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(ruleset.formatRules)) {
      const value = this.getNestedValue(resource, field);

      if (value !== undefined && value !== null) {
        let isValid = false;

        if (rule instanceof RegExp) {
          isValid = rule.test(String(value));
        } else if (typeof rule === 'function') {
          isValid = rule(value);
        }

        if (!isValid) {
          errors.push({
            field,
            code: 'INVALID_FORMAT',
            message: `Field '${field}' has invalid format`,
            severity: 'error',
            value
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(
    resource: any,
    ruleset: ValidationRuleSet
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const businessRule of ruleset.businessRules) {
      try {
        const isValid = businessRule.rule(resource);

        if (!isValid) {
          if (businessRule.severity === 'error') {
            errors.push({
              field: 'businessRule',
              code: 'BUSINESS_RULE_VIOLATION',
              message: businessRule.description,
              severity: 'error'
            });
          } else {
            warnings.push({
              field: 'businessRule',
              message: businessRule.description,
              suggestion: `Review ${businessRule.name} business rule compliance`,
              impact: 'medium'
            });
          }
        }
      } catch (error) {
        errors.push({
          field: 'businessRule',
          code: 'RULE_EVALUATION_ERROR',
          message: `Error evaluating business rule: ${businessRule.name}`,
          severity: 'error'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate cross-resource rules
   */
  private validateCrossResourceRules(
    resource: any,
    relatedResources: any[],
    ruleset: ValidationRuleSet
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!ruleset.crossResourceRules) {
      return { errors, warnings };
    }

    for (const crossRule of ruleset.crossResourceRules) {
      try {
        const isValid = crossRule.rule(resource, relatedResources);

        if (!isValid) {
          warnings.push({
            field: 'crossResourceRule',
            message: crossRule.description,
            suggestion: `Review relationships with related resources`,
            impact: 'medium'
          });
        }
      } catch (error) {
        errors.push({
          field: 'crossResourceRule',
          code: 'CROSS_RULE_EVALUATION_ERROR',
          message: `Error evaluating cross-resource rule: ${crossRule.name}`,
          severity: 'error'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(resource: any, ruleset: ValidationRuleSet): QualityMetrics {
    const allFields = [...ruleset.requiredFields, ...ruleset.optionalFields];
    const filledFields = allFields.filter(field => {
      const value = this.getNestedValue(resource, field);
      return value !== undefined && value !== null && value !== '';
    });

    const completeness = (filledFields.length / allFields.length) * 100;

    // Basic accuracy based on format compliance
    const formatCompliantFields = Object.keys(ruleset.formatRules).filter(field => {
      const value = this.getNestedValue(resource, field);
      if (value === undefined || value === null) return true;

      const rule = ruleset.formatRules[field];
      if (rule instanceof RegExp) {
        return rule.test(String(value));
      } else if (typeof rule === 'function') {
        return rule(value);
      }
      return true;
    });

    const accuracy = (formatCompliantFields.length / Object.keys(ruleset.formatRules).length) * 100;

    // Timeliness based on lastUpdated
    const lastUpdated = new Date(resource.meta?.lastUpdated || resource.meta?.created || 0);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const timeliness = Math.max(0, 100 - (daysSinceUpdate * 2)); // Decrease by 2% per day

    return {
      completeness: Math.round(completeness),
      consistency: 85, // Placeholder - would need cross-resource analysis
      accuracy: Math.round(accuracy),
      timeliness: Math.round(timeliness),
      uniqueness: 95 // Placeholder - would need duplicate detection
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      completeness: 0.3,
      consistency: 0.2,
      accuracy: 0.3,
      timeliness: 0.1,
      uniqueness: 0.1
    };

    const score =
      metrics.completeness * weights.completeness +
      metrics.consistency * weights.consistency +
      metrics.accuracy * weights.accuracy +
      metrics.timeliness * weights.timeliness +
      metrics.uniqueness * weights.uniqueness;

    return Math.round(score);
  }

  /**
   * Generate quality improvement recommendations
   */
  private generateQualityRecommendations(
    resource: any,
    metrics: QualityMetrics,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.completeness < 80) {
      recommendations.push('Fill in missing optional fields to improve data completeness');
    }

    if (metrics.accuracy < 90) {
      recommendations.push('Review and correct data format issues');
    }

    if (metrics.timeliness < 70) {
      recommendations.push('Update resource with more recent information');
    }

    if (errors.length > 0) {
      recommendations.push(`Address ${errors.length} validation errors`);
    }

    if (warnings.length > 3) {
      recommendations.push('Review and resolve data quality warnings');
    }

    return recommendations;
  }

  /**
   * Find related resources for cross-validation
   */
  private findRelatedResources(resource: any, allResources: any[]): any[] {
    // const resourceType = resource.resourceType;
    const resourceId = resource.id;

    return allResources.filter(r => {
      if (r.id === resourceId) return false;

      // Find resources that reference this resource
      const references = this.extractReferences(r);
      return references.some(ref => ref.includes(resourceId));
    });
  }

  /**
   * Extract references from a resource
   */
  private extractReferences(resource: any): string[] {
    const references: string[] = [];

    const extractFromValue = (value: any): void => {
      if (typeof value === 'string' && value.includes('/')) {
        references.push(value);
      } else if (typeof value === 'object' && value !== null) {
        if (value.reference) {
          references.push(value.reference);
        }
        Object.values(value).forEach(extractFromValue);
      } else if (Array.isArray(value)) {
        value.forEach(extractFromValue);
      }
    };

    Object.values(resource).forEach(extractFromValue);
    return references;
  }

  /**
   * Validate batch consistency
   */
  private async validateBatchConsistency(
    results: Map<string, ValidationResult>,
    resourcesByType: Map<string, any[]>
  ): Promise<void> {
    // Check for duplicate identifiers within each resource type
    for (const [_, resources] of resourcesByType) {
      const identifiers = new Map<string, string[]>();

      resources.forEach((resource, index) => {
        const resourceIdentifiers = resource.identifier || [];
        resourceIdentifiers.forEach((id: any) => {
          const key = `${id.system}|${id.value}`;
          if (!identifiers.has(key)) {
            identifiers.set(key, []);
          }
          identifiers.get(key)!.push(resource.id || `index-${index}`);
        });
      });

      // Flag duplicates
      for (const [identifier, resourceIds] of identifiers) {
        if (resourceIds.length > 1) {
          resourceIds.forEach(resourceId => {
            const result = results.get(resourceId);
            if (result) {
              result.warnings.push({
                field: 'identifier',
                message: `Duplicate identifier found: ${identifier}`,
                suggestion: 'Review and resolve duplicate identifiers',
                impact: 'high'
              });
              result.score = Math.max(0, result.score - 10);
            }
          });
        }
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Initialize default validation rulesets
   */
  private initializeDefaultRulesets(): void {
    // Patient validation rules
    this.addRuleset({
      resourceType: 'Patient',
      requiredFields: ['id', 'active', 'name'],
      optionalFields: ['identifier', 'telecom', 'address', 'birthDate', 'gender'],
      formatRules: {
        'birthDate': /^\d{4}-\d{2}-\d{2}$/,
        'gender': (value) => ['male', 'female', 'other', 'unknown'].includes(value),
        'telecom.system': (value) => ['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other'].includes(value)
      },
      businessRules: [
        {
          name: 'active_status',
          description: 'Patient must have a valid active status',
          rule: (resource) => typeof resource.active === 'boolean',
          severity: 'error'
        },
        {
          name: 'name_completeness',
          description: 'Patient should have both family and given names',
          rule: (resource) => {
            const names = resource.name || [];
            return names.some((name: any) => name.family && name.given && name.given.length > 0);
          },
          severity: 'warning'
        }
      ]
    });

    // Encounter validation rules
    this.addRuleset({
      resourceType: 'Encounter',
      requiredFields: ['id', 'status', 'class', 'subject'],
      optionalFields: ['period', 'serviceProvider', 'diagnosis', 'location'],
      formatRules: {
        'status': (value) => ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'].includes(value),
        'subject.reference': /^Patient\/.+/
      },
      businessRules: [
        {
          name: 'period_consistency',
          description: 'Encounter period end should be after start',
          rule: (resource) => {
            if (!resource.period) return true;
            const start = new Date(resource.period.start);
            const end = new Date(resource.period.end);
            return !resource.period.end || start <= end;
          },
          severity: 'error'
        }
      ]
    });

    // Observation validation rules
    this.addRuleset({
      resourceType: 'Observation',
      requiredFields: ['id', 'status', 'code', 'subject'],
      optionalFields: ['value', 'component', 'effectiveDateTime', 'performer'],
      formatRules: {
        'status': (value) => ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'].includes(value),
        'subject.reference': /^Patient\/.+/
      },
      businessRules: [
        {
          name: 'value_or_components',
          description: 'Observation must have either a value or components',
          rule: (resource) => {
            return resource.valueQuantity || resource.valueString || resource.component;
          },
          severity: 'warning'
        }
      ]
    });
  }
}

// Global validator instance
export const healthLakeValidator = new HealthLakeValidator();

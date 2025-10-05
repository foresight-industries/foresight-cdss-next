import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { 
  CustomFieldMapping,
  MappingValidationResult,
  ValidationRule,
  TransformationRule 
} from '@/types/field-mapping.types';

// POST - Validate field mappings
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { mappings, sample_data } = body;

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ 
        error: 'Invalid request: mappings array required' 
      }, { status: 400 });
    }

    // Verify user has team access
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    const validationResults: MappingValidationResult[] = [];

    for (const mapping of mappings) {
      const result = await validateMapping(mapping, sample_data);
      validationResults.push(result);
    }

    // Check for conflicts between mappings
    const conflicts = findMappingConflicts(mappings);

    // Aggregate results
    const overallResult: MappingValidationResult = {
      is_valid: validationResults.every(r => r.is_valid) && conflicts.length === 0,
      errors: validationResults.flatMap(r => r.errors).concat(conflicts),
      warnings: validationResults.flatMap(r => r.warnings),
      field_conflicts: validationResults.flatMap(r => r.field_conflicts)
    };

    return NextResponse.json({
      validation_result: overallResult,
      individual_results: validationResults
    });

  } catch (error) {
    console.error('Field mapping validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function validateMapping(
  mapping: Partial<CustomFieldMapping>, 
  sampleData?: any
): Promise<MappingValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldConflicts: string[] = [];

  // Validate required fields
  if (!mapping.entity_type) {
    errors.push('Entity type is required');
  }
  
  if (!mapping.source_path) {
    errors.push('Source path is required');
  }

  // Validate source path format
  if (mapping.source_path) {
    if (!isValidSourcePath(mapping.source_path)) {
      errors.push('Invalid source path format');
    }
  }

  // Validate target mapping
  if (mapping.target_table && mapping.target_column) {
    // Check if target table.column combination is valid
    if (!isValidTargetMapping(mapping.target_table, mapping.target_column, mapping.entity_type)) {
      errors.push(`Invalid target mapping: ${mapping.target_table}.${mapping.target_column}`);
    }
  } else if (mapping.target_table || mapping.target_column) {
    warnings.push('Incomplete target mapping: both table and column should be specified');
  }

  // Validate transformation rules
  if (mapping.transformation_rules) {
    const transformationErrors = validateTransformationRules(mapping.transformation_rules);
    errors.push(...transformationErrors);
  }

  // Validate validation rules
  if (mapping.validation_rules) {
    const validationErrors = validateValidationRules(mapping.validation_rules);
    errors.push(...validationErrors);
  }

  // Test mapping with sample data if provided
  if (sampleData && mapping.source_path) {
    try {
      const testResult = testMappingWithSampleData(mapping, sampleData);
      if (testResult.warnings.length > 0) {
        warnings.push(...testResult.warnings);
      }
      if (testResult.errors.length > 0) {
        errors.push(...testResult.errors);
      }
    } catch (error) {
      warnings.push('Could not test mapping with sample data');
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    field_conflicts
  };
}

function isValidSourcePath(sourcePath: string): boolean {
  // Basic validation for JSONPath or XPath-like syntax
  // Should start with $ for JSONPath or / for XPath
  if (sourcePath.startsWith('$') || sourcePath.startsWith('/')) {
    return true;
  }
  
  // Simple dot notation
  if (/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(sourcePath)) {
    return true;
  }
  
  return false;
}

function isValidTargetMapping(table: string, column: string, entityType?: string): boolean {
  // Define valid table/column combinations for each entity type
  const validMappings: Record<string, Record<string, string[]>> = {
    patient: {
      patient: ['id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'email', 'address'],
      patient_address: ['street', 'city', 'state', 'zip_code', 'country']
    },
    provider: {
      provider: ['id', 'npi', 'first_name', 'last_name', 'specialty', 'practice_name', 'phone', 'email'],
      provider_address: ['street', 'city', 'state', 'zip_code', 'country']
    },
    claim: {
      claim: ['id', 'patient_id', 'provider_id', 'service_date', 'total_amount', 'status'],
      claim_line_item: ['procedure_code', 'diagnosis_code', 'amount', 'quantity']
    },
    prior_auth: {
      prior_auth: ['id', 'patient_id', 'provider_id', 'service_type', 'urgency', 'status'],
      prior_auth_service: ['procedure_code', 'diagnosis_code', 'quantity', 'frequency']
    }
  };

  if (!entityType || !validMappings[entityType]) {
    return true; // Allow if we can't validate
  }

  const entityTables = validMappings[entityType];
  if (!entityTables[table]) {
    return false;
  }

  return entityTables[table].includes(column);
}

function validateTransformationRules(rules: TransformationRule[]): string[] {
  const errors: string[] = [];

  for (const [index, rule] of rules.entries()) {
    if (!rule.type) {
      errors.push(`Transformation rule ${index + 1}: type is required`);
      continue;
    }

    // Validate specific transformation types
    switch (rule.type) {
      case 'format_phone':
        if (!rule.parameters?.format) {
          errors.push(`Transformation rule ${index + 1}: format parameter required for phone formatting`);
        }
        break;
      case 'format_date':
        if (!rule.parameters?.input_format || !rule.parameters?.output_format) {
          errors.push(`Transformation rule ${index + 1}: input_format and output_format required for date formatting`);
        }
        break;
      case 'pattern':
        if (!rule.parameters?.regex) {
          errors.push(`Transformation rule ${index + 1}: regex parameter required for pattern transformation`);
        }
        break;
      case 'custom':
        if (!rule.custom_function) {
          errors.push(`Transformation rule ${index + 1}: custom_function required for custom transformation`);
        }
        break;
    }

    // Validate order
    if (typeof rule.order !== 'number' || rule.order < 0) {
      errors.push(`Transformation rule ${index + 1}: valid order number required`);
    }
  }

  // Check for duplicate orders
  const orders = rules.map(r => r.order);
  const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
  if (duplicateOrders.length > 0) {
    errors.push(`Duplicate transformation rule orders: ${duplicateOrders.join(', ')}`);
  }

  return errors;
}

function validateValidationRules(rules: ValidationRule[]): string[] {
  const errors: string[] = [];

  for (const [index, rule] of rules.entries()) {
    if (!rule.type) {
      errors.push(`Validation rule ${index + 1}: type is required`);
      continue;
    }

    // Validate specific validation types
    switch (rule.type) {
      case 'min_length':
      case 'max_length':
        if (typeof rule.parameters?.length !== 'number' || rule.parameters.length < 0) {
          errors.push(`Validation rule ${index + 1}: valid length parameter required`);
        }
        break;
      case 'pattern':
        if (!rule.parameters?.regex) {
          errors.push(`Validation rule ${index + 1}: regex parameter required for pattern validation`);
        }
        break;
      case 'custom':
        if (!rule.parameters?.function) {
          errors.push(`Validation rule ${index + 1}: function parameter required for custom validation`);
        }
        break;
    }

    if (typeof rule.is_blocking !== 'boolean') {
      errors.push(`Validation rule ${index + 1}: is_blocking must be boolean`);
    }
  }

  return errors;
}

function testMappingWithSampleData(mapping: Partial<CustomFieldMapping>, sampleData: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Try to extract value using source path
    const value = extractValueFromPath(sampleData, mapping.source_path!);
    
    if (value === undefined || value === null) {
      warnings.push('Source path does not match any data in sample');
      return { errors, warnings };
    }

    // Apply transformations if any
    let transformedValue = value;
    if (mapping.transformation_rules) {
      for (const rule of mapping.transformation_rules.sort((a, b) => a.order - b.order)) {
        transformedValue = applyTransformation(transformedValue, rule);
      }
    }

    // Apply validations if any
    if (mapping.validation_rules) {
      for (const rule of mapping.validation_rules) {
        const validationResult = applyValidation(transformedValue, rule);
        if (!validationResult.isValid) {
          if (rule.is_blocking) {
            errors.push(validationResult.message || 'Validation failed');
          } else {
            warnings.push(validationResult.message || 'Validation warning');
          }
        }
      }
    }

  } catch (error) {
    errors.push(`Error testing mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { errors, warnings };
}

function extractValueFromPath(data: any, path: string): any {
  // Simple implementation for dot notation and basic JSONPath
  if (path.startsWith('$.')) {
    path = path.substring(2);
  }
  
  return path.split('.').reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : undefined;
  }, data);
}

function applyTransformation(value: any, rule: TransformationRule): any {
  switch (rule.type) {
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    default:
      return value; // For more complex transformations, would need actual implementation
  }
}

function applyValidation(value: any, rule: ValidationRule): { isValid: boolean; message?: string } {
  switch (rule.type) {
    case 'required':
      return {
        isValid: value !== null && value !== undefined && value !== '',
        message: rule.error_message || 'Field is required'
      };
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: typeof value === 'string' && emailRegex.test(value),
        message: rule.error_message || 'Invalid email format'
      };
    case 'min_length':
      return {
        isValid: typeof value === 'string' && value.length >= (rule.parameters?.length || 0),
        message: rule.error_message || `Minimum length is ${rule.parameters?.length}`
      };
    case 'max_length':
      return {
        isValid: typeof value === 'string' && value.length <= (rule.parameters?.length || Infinity),
        message: rule.error_message || `Maximum length is ${rule.parameters?.length}`
      };
    default:
      return { isValid: true };
  }
}

function findMappingConflicts(mappings: Partial<CustomFieldMapping>[]): string[] {
  const conflicts: string[] = [];
  const pathMap = new Map<string, number>();

  mappings.forEach((mapping, index) => {
    if (mapping.source_path) {
      const key = `${mapping.entity_type}:${mapping.source_path}`;
      if (pathMap.has(key)) {
        conflicts.push(`Duplicate source path "${mapping.source_path}" for entity type "${mapping.entity_type}"`);
      } else {
        pathMap.set(key, index);
      }
    }

    if (mapping.target_table && mapping.target_column) {
      const targetKey = `${mapping.target_table}.${mapping.target_column}`;
      const existingIndex = Array.from(pathMap.entries()).find(([k, v]) => 
        k.includes(targetKey) && v !== index
      );
      if (existingIndex) {
        conflicts.push(`Multiple mappings target the same field: ${targetKey}`);
      }
    }
  });

  return conflicts;
}
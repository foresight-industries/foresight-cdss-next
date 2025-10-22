import { db } from '@foresight-cdss-next/db';
import { fhirResources, type FhirResource } from '@foresight-cdss-next/db/schema';
import { eq } from 'drizzle-orm';

export interface ConflictData {
  field: string;
  localValue: any;
  remoteValue: any;
  lastModified: {
    local: Date;
    remote: Date;
  };
  conflictType: 'value_mismatch' | 'version_mismatch' | 'structural_change' | 'deletion_conflict';
}

export interface ResourceConflict {
  resourceId: string;
  organizationId: string;
  resourceType: string;
  fhirId: string;
  localResource: any;
  remoteResource: any;
  conflicts: ConflictData[];
  conflictSeverity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedResource: any;
  appliedChanges: Array<{
    field: string;
    action: 'keep_local' | 'accept_remote' | 'merge' | 'manual_override';
    value: any;
    reason: string;
  }>;
  resolvedAt: Date;
  resolvedBy: 'system' | 'user';
}

export type ConflictResolutionStrategy =
  | 'local_wins'           // Always keep local version
  | 'remote_wins'          // Always accept remote version
  | 'timestamp_based'      // Use most recent timestamp
  | 'merge_compatible'     // Merge non-conflicting changes
  | 'manual_review'        // Require manual intervention
  | 'field_priority'       // Use field-specific priority rules
  | 'source_priority';     // Prioritize based on data source reliability

export interface ConflictResolutionConfig {
  defaultStrategy: ConflictResolutionStrategy;
  fieldStrategies: Record<string, ConflictResolutionStrategy>;
  severityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  autoResolveBelow: 'low' | 'medium' | 'high' | 'never';
  criticalFields: string[]; // Fields that always require manual review
  trustedSources: string[]; // Data sources with higher priority
}

export class HealthLakeConflictResolver {
  private pendingConflicts = new Map<string, ResourceConflict>();
  private resolutionHistory = new Map<string, ConflictResolution[]>();

  constructor(private config: ConflictResolutionConfig) {}

  /**
   * Detect conflicts between local and remote FHIR resources
   */
  async detectConflicts(
    localResource: FhirResource,
    remoteResource: any
  ): Promise<ResourceConflict | null> {
    const conflicts: ConflictData[] = [];

    // Compare resource versions
    const localVersion = localResource.fhirData?.meta?.versionId;
    const remoteVersion = remoteResource?.meta?.versionId;

    if (localVersion && remoteVersion && localVersion !== remoteVersion) {
      conflicts.push({
        field: 'meta.versionId',
        localValue: localVersion,
        remoteValue: remoteVersion,
        lastModified: {
          local: new Date(localResource.updatedAt),
          remote: new Date(remoteResource.meta?.lastUpdated ?? 0)
        },
        conflictType: 'version_mismatch'
      });
    }

    // Deep compare resource fields
    const fieldConflicts = this.compareResourceFields(
      localResource.fhirData,
      remoteResource
    );
    conflicts.push(...fieldConflicts);

    if (conflicts.length === 0) {
      return null; // No conflicts detected
    }

    const severity = this.calculateConflictSeverity(conflicts);

    const resourceConflict: ResourceConflict = {
      resourceId: localResource.id,
      organizationId: localResource.organizationId,
      resourceType: localResource.resourceType,
      fhirId: localResource.fhirId,
      localResource: localResource.fhirData,
      remoteResource,
      conflicts,
      conflictSeverity: severity,
      detectedAt: new Date()
    };

    // Store conflict for potential resolution
    const conflictKey = `${localResource.organizationId}-${localResource.fhirId}`;
    this.pendingConflicts.set(conflictKey, resourceConflict);

    return resourceConflict;
  }

  /**
   * Resolve conflicts based on configured strategy
   */
  async resolveConflict(
    conflict: ResourceConflict,
    strategy?: ConflictResolutionStrategy,
    manualOverrides?: Record<string, any>
  ): Promise<ConflictResolution> {
    const resolutionStrategy = strategy || this.config.defaultStrategy;
    const appliedChanges: ConflictResolution['appliedChanges'] = [];

    let resolvedResource = { ...conflict.localResource };

    for (const conflictData of conflict.conflicts) {
      const fieldStrategy = this.config.fieldStrategies[conflictData.field] || resolutionStrategy;

      // Check for manual override
      if (manualOverrides && conflictData.field in manualOverrides) {
        this.setNestedField(resolvedResource, conflictData.field, manualOverrides[conflictData.field]);
        appliedChanges.push({
          field: conflictData.field,
          action: 'manual_override',
          value: manualOverrides[conflictData.field],
          reason: 'Manual override provided'
        });
        continue;
      }

      // Check if field requires manual review
      if (this.config.criticalFields.includes(conflictData.field)) {
        throw new Error(
          `Field ${conflictData.field} requires manual review and no override was provided`
        );
      }

      // Apply resolution strategy
      const resolution = this.applyResolutionStrategy(
        fieldStrategy,
        conflictData,
        conflict
      );

      this.setNestedField(resolvedResource, conflictData.field, resolution.value);
      appliedChanges.push(resolution);
    }

    const conflictResolution: ConflictResolution = {
      strategy: resolutionStrategy,
      resolvedResource,
      appliedChanges,
      resolvedAt: new Date(),
      resolvedBy: manualOverrides ? 'user' : 'system'
    };

    // Store resolution history
    const conflictKey = `${conflict.organizationId}-${conflict.fhirId}`;
    const history = this.resolutionHistory.get(conflictKey) || [];
    history.push(conflictResolution);
    this.resolutionHistory.set(conflictKey, history);

    // Remove from pending conflicts
    this.pendingConflicts.delete(conflictKey);

    return conflictResolution;
  }

  /**
   * Auto-resolve conflicts that meet criteria
   */
  async autoResolveConflicts(): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];
    const autoResolvableConflicts = Array.from(this.pendingConflicts.values())
      .filter(conflict => this.canAutoResolve(conflict));

    for (const conflict of autoResolvableConflicts) {
      try {
        const resolution = await this.resolveConflict(conflict);
        resolutions.push(resolution);

        // Update the resource in database
        await this.updateResolvedResource(conflict.resourceId, resolution.resolvedResource);

        console.log(`✅ Auto-resolved conflict for ${conflict.fhirId} using ${resolution.strategy}`);
      } catch (error) {
        console.error(`❌ Failed to auto-resolve conflict for ${conflict.fhirId}:`, error);
      }
    }

    return resolutions;
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(): ResourceConflict[] {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Get pending conflicts for a specific organization
   */
  getOrganizationConflicts(organizationId: string): ResourceConflict[] {
    return Array.from(this.pendingConflicts.values())
      .filter(conflict => conflict.organizationId === organizationId);
  }

  /**
   * Get conflict resolution history
   */
  getResolutionHistory(organizationId?: string): ConflictResolution[] {
    return Array.from(this.resolutionHistory.values())
      .flat()
      .filter(resolution => !organizationId ||
        this.getOrganizationFromResolution(resolution) === organizationId);
  }

  /**
   * Compare FHIR resource fields to detect conflicts
   */
  private compareResourceFields(local: any, remote: any, prefix = ''): ConflictData[] {
    const conflicts: ConflictData[] = [];

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(remote || {})
    ]);

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const localValue = local?.[key];
      const remoteValue = remote?.[key];

      // Skip meta fields that are expected to differ
      if (fieldPath.startsWith('meta.') && !fieldPath.includes('versionId')) {
        continue;
      }

      if (localValue === undefined && remoteValue !== undefined) {
        conflicts.push({
          field: fieldPath,
          localValue: undefined,
          remoteValue,
          lastModified: {
            local: new Date(local?.meta?.lastUpdated || 0),
            remote: new Date(remote?.meta?.lastUpdated || 0)
          },
          conflictType: 'structural_change'
        });
      } else if (localValue !== undefined && remoteValue === undefined) {
        conflicts.push({
          field: fieldPath,
          localValue,
          remoteValue: undefined,
          lastModified: {
            local: new Date(local?.meta?.lastUpdated || 0),
            remote: new Date(remote?.meta?.lastUpdated || 0)
          },
          conflictType: 'deletion_conflict'
        });
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        // Recursively compare nested objects
        if (localValue !== null && remoteValue !== null) {
          const nestedConflicts = this.compareResourceFields(localValue, remoteValue, fieldPath);
          conflicts.push(...nestedConflicts);
        }
      } else if (localValue !== remoteValue) {
        conflicts.push({
          field: fieldPath,
          localValue,
          remoteValue,
          lastModified: {
            local: new Date(local?.meta?.lastUpdated || 0),
            remote: new Date(remote?.meta?.lastUpdated || 0)
          },
          conflictType: 'value_mismatch'
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate conflict severity based on conflict types and affected fields
   */
  private calculateConflictSeverity(conflicts: ConflictData[]): ResourceConflict['conflictSeverity'] {
    let score = 0;

    for (const conflict of conflicts) {
      // Base score by conflict type
      switch (conflict.conflictType) {
        case 'value_mismatch':
          score += 1;
          break;
        case 'version_mismatch':
          score += 2;
          break;
        case 'structural_change':
          score += 3;
          break;
        case 'deletion_conflict':
          score += 4;
          break;
      }

      // Additional score for critical fields
      if (this.config.criticalFields.includes(conflict.field)) {
        score += 5;
      }
    }

    if (score >= this.config.severityThresholds.high) return 'critical';
    if (score >= this.config.severityThresholds.medium) return 'high';
    if (score >= this.config.severityThresholds.low) return 'medium';
    return 'low';
  }

  /**
   * Check if a conflict can be auto-resolved
   */
  private canAutoResolve(conflict: ResourceConflict): boolean {
    // Never auto-resolve critical severity
    if (conflict.conflictSeverity === 'critical') {
      return false;
    }

    // Check against auto-resolve threshold
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const conflictLevel = severityLevels.indexOf(conflict.conflictSeverity);
    const thresholdLevel = severityLevels.indexOf(this.config.autoResolveBelow);

    if (thresholdLevel === -1 || conflictLevel >= thresholdLevel) {
      return false;
    }

    // Check if any conflicts involve critical fields
    return !conflict.conflicts.some(c => this.config.criticalFields.includes(c.field));
  }

  /**
   * Apply resolution strategy to a specific conflict
   */
  private applyResolutionStrategy(
    strategy: ConflictResolutionStrategy,
    conflict: ConflictData,
    resourceConflict: ResourceConflict
  ): ConflictResolution['appliedChanges'][0] {
    switch (strategy) {
      case 'local_wins':
        return {
          field: conflict.field,
          action: 'keep_local',
          value: conflict.localValue,
          reason: 'Local version prioritized by strategy'
        };

      case 'remote_wins':
        return {
          field: conflict.field,
          action: 'accept_remote',
          value: conflict.remoteValue,
          reason: 'Remote version prioritized by strategy'
        };

      case 'timestamp_based':
        const useRemote = conflict.lastModified.remote > conflict.lastModified.local;
        return {
          field: conflict.field,
          action: useRemote ? 'accept_remote' : 'keep_local',
          value: useRemote ? conflict.remoteValue : conflict.localValue,
          reason: `Using ${useRemote ? 'remote' : 'local'} version (more recent)`
        };

      case 'merge_compatible':
        // For array fields, try to merge
        if (Array.isArray(conflict.localValue) && Array.isArray(conflict.remoteValue)) {
          const merged = [...new Set([...conflict.localValue, ...conflict.remoteValue])];
          return {
            field: conflict.field,
            action: 'merge',
            value: merged,
            reason: 'Merged compatible array values'
          };
        }
        // Fall back to timestamp-based for non-mergeable types
        return this.applyResolutionStrategy('timestamp_based', conflict, resourceConflict);

      case 'source_priority':
        // Check if remote source is trusted
        const remoteSource = resourceConflict.remoteResource?.meta?.source;
        const isTrustedSource = this.config.trustedSources.includes(remoteSource);
        return {
          field: conflict.field,
          action: isTrustedSource ? 'accept_remote' : 'keep_local',
          value: isTrustedSource ? conflict.remoteValue : conflict.localValue,
          reason: `Using ${isTrustedSource ? 'trusted remote' : 'local'} source`
        };

      default:
        throw new Error(`Manual review required for field ${conflict.field}`);
    }
  }

  /**
   * Set nested field value in object
   */
  private setNestedField(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Update resolved resource in database
   */
  private async updateResolvedResource(resourceId: string, resolvedData: any): Promise<void> {
    await db
      .update(fhirResources)
      .set({
        fhirData: resolvedData,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
        updatedAt: new Date()
      })
      .where(eq(fhirResources.id, resourceId));
  }

  /**
   * Extract organization ID from resolution (helper method)
   */
  private getOrganizationFromResolution(resolution: ConflictResolution): string {
    // This would need to be implemented based on how we track organization context
    return resolution.resolvedResource?.meta?.source?.match(/org-(.+)/)?.[1] || '';
  }
}

// Default configuration
export const defaultConflictConfig: ConflictResolutionConfig = {
  defaultStrategy: 'timestamp_based',
  fieldStrategies: {
    'id': 'local_wins',
    'meta.versionId': 'remote_wins',
    'meta.lastUpdated': 'remote_wins',
    'identifier': 'merge_compatible',
    'active': 'remote_wins',
    'name': 'timestamp_based',
    'telecom': 'merge_compatible',
    'address': 'timestamp_based'
  },
  severityThresholds: {
    low: 3,
    medium: 8,
    high: 15
  },
  autoResolveBelow: 'medium',
  criticalFields: [
    'id',
    'identifier.value',
    'birthDate',
    'deceasedDateTime',
    'active'
  ],
  trustedSources: [
    'epic-ehr',
    'cerner-ehr',
    'healthlake-canonical'
  ]
};

// Global conflict resolver instance
export const healthLakeConflictResolver = new HealthLakeConflictResolver(defaultConflictConfig);

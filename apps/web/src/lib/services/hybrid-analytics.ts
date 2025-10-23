import { crossProviderAnalyticsService, type CrossProviderMetrics, type AnalyticsTimeframe } from './cross-provider-analytics';
import { healthLakeService } from './healthlake-integration';
import { db } from '@foresight-cdss-next/db';
import {
  fhirResources,
  patients,
  encounters
} from '@foresight-cdss-next/db/schema';
import { inArray, count, sql } from 'drizzle-orm';

export interface HybridAnalyticsConfig {
  healthLakeDatastoreId: string;
  enableHealthLakeAnalytics: boolean;
  prioritizeHealthLakeData: boolean;
  fallbackToLocal: boolean;
  cacheTimeoutMinutes: number;
}

export interface HybridMetrics extends CrossProviderMetrics {
  dataSource: {
    local: {
      enabled: boolean;
      resourceCount: number;
      lastSyncAt: Date | null;
    };
    healthLake: {
      enabled: boolean;
      datastoreStatus: string;
      resourceCount: number;
      lastExportAt: Date | null;
    };
  };
  dataQuality: {
    completeness: number; // 0-100%
    consistency: number; // 0-100%
    duplicates: number;
    conflicts: number;
  };
  recommendations: {
    dataSync: string[];
    quality: string[];
    performance: string[];
  };
}

export interface DataSourceComparison {
  metric: string;
  localValue: number;
  healthLakeValue: number;
  difference: number;
  percentageDiff: number;
  recommendation: string;
}

export interface AnalyticsInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  dataSource: 'local' | 'healthlake' | 'hybrid';
  recommendedActions: string[];
  affectedOrganizations?: string[];
}

export class HybridAnalyticsService {
  private config: HybridAnalyticsConfig;
  private cache = new Map<string, { data: any; timestamp: Date }>();

  constructor(config: HybridAnalyticsConfig) {
    this.config = config;
  }

  /**
   * Get comprehensive hybrid analytics combining local and HealthLake data
   */
  async getHybridCrossProviderAnalytics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<HybridMetrics> {
    const cacheKey = `hybrid-analytics-${organizationIds.join('-')}-${timeframe.from.getTime()}-${timeframe.to.getTime()}`;

    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get local analytics
      const localMetrics = await crossProviderAnalyticsService.getCrossProviderAnalytics(
        organizationIds,
        timeframe
      );

      let healthLakeMetrics: Partial<CrossProviderMetrics> = {};
      let healthLakeDataSource = {
        enabled: false,
        datastoreStatus: 'unknown',
        resourceCount: 0,
        lastExportAt: null as Date | null
      };

      // Get HealthLake analytics if enabled
      if (this.config.enableHealthLakeAnalytics) {
        try {
          healthLakeMetrics = await this.getHealthLakeAnalytics(organizationIds, timeframe);
          const datastoreInfo = await healthLakeService.getDatastore(this.config.healthLakeDatastoreId);

          healthLakeDataSource = {
            enabled: true,
            datastoreStatus: datastoreInfo?.datastoreStatus || 'unknown',
            resourceCount: await this.getHealthLakeResourceCount(organizationIds),
            lastExportAt: await this.getLastHealthLakeExportTime()
          };
        } catch (error) {
          console.error('Failed to get HealthLake analytics:', error);
          if (!this.config.fallbackToLocal) {
            throw error;
          }
        }
      }

      // Merge and enhance metrics
      const hybridMetrics = await this.mergeMetrics(localMetrics, healthLakeMetrics, organizationIds, timeframe);

      // Add data source information
      hybridMetrics.dataSource = {
        local: {
          enabled: true,
          resourceCount: await this.getLocalResourceCount(organizationIds),
          lastSyncAt: await this.getLastLocalSyncTime(organizationIds)
        },
        healthLake: healthLakeDataSource
      };

      // Calculate data quality metrics
      hybridMetrics.dataQuality = await this.calculateDataQuality(organizationIds, localMetrics, healthLakeMetrics);

      // Generate recommendations
      hybridMetrics.recommendations = this.generateHybridRecommendations(hybridMetrics);

      // Cache the results
      this.setCachedData(cacheKey, hybridMetrics);

      return hybridMetrics;

    } catch (error) {
      console.error('Failed to get hybrid analytics:', error);

      if (this.config.fallbackToLocal) {
        console.log('Falling back to local analytics only');
        const localMetrics = await crossProviderAnalyticsService.getCrossProviderAnalytics(
          organizationIds,
          timeframe
        );

        return this.convertToHybridMetrics(localMetrics, organizationIds);
      }

      throw error;
    }
  }

  /**
   * Compare data sources for quality and consistency analysis
   */
  async compareDataSources(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<DataSourceComparison[]> {
    const localMetrics = await crossProviderAnalyticsService.getCrossProviderAnalytics(
      organizationIds,
      timeframe
    );

    const healthLakeMetrics = await this.getHealthLakeAnalytics(organizationIds, timeframe);

    const comparisons: DataSourceComparison[] = [];

    // Compare key metrics
    const metricsToCompare = [
      { key: 'totalPatients', label: 'Total Patients' },
      { key: 'totalEncounters', label: 'Total Encounters' },
      { key: 'priorAuthMetrics.total', label: 'Prior Authorizations' },
      { key: 'priorAuthMetrics.approvalRate', label: 'Approval Rate %' },
      { key: 'documentMetrics.processingRate', label: 'Document Processing Rate %' }
    ];

    for (const metric of metricsToCompare) {
      const localValue = this.getNestedValue(localMetrics, metric.key) || 0;
      const healthLakeValue = this.getNestedValue(healthLakeMetrics, metric.key) || 0;
      const difference = healthLakeValue - localValue;
      const percentageDiff = localValue > 0 ? (difference / localValue) * 100 : 0;

      comparisons.push({
        metric: metric.label,
        localValue,
        healthLakeValue,
        difference,
        percentageDiff,
        recommendation: this.generateComparisonRecommendation(metric.key, percentageDiff)
      });
    }

    return comparisons;
  }

  /**
   * Generate advanced analytics insights using both data sources
   */
  async generateAdvancedInsights(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<AnalyticsInsight[]> {
    const hybridMetrics = await this.getHybridCrossProviderAnalytics(organizationIds, timeframe);
    const comparisons = await this.compareDataSources(organizationIds, timeframe);

    const insights: AnalyticsInsight[] = [];

    // Data quality insights
    if (hybridMetrics.dataQuality.completeness < 85) {
      insights.push({
        type: 'risk',
        severity: 'high',
        title: 'Data Completeness Below Threshold',
        description: `Data completeness is ${hybridMetrics.dataQuality.completeness.toFixed(1)}%, below the recommended 85% threshold.`,
        dataSource: 'hybrid',
        recommendedActions: [
          'Review EHR integration mappings',
          'Implement data validation rules',
          'Increase sync frequency'
        ]
      });
    }

    // Sync consistency insights
    const significantDifferences = comparisons.filter(c => Math.abs(c.percentageDiff) > 10);
    if (significantDifferences.length > 0) {
      insights.push({
        type: 'anomaly',
        severity: 'medium',
        title: 'Data Source Inconsistencies Detected',
        description: `Found ${significantDifferences.length} metrics with >10% difference between local and HealthLake data.`,
        dataSource: 'hybrid',
        recommendedActions: [
          'Investigate sync process integrity',
          'Validate data transformation logic',
          'Review recent EHR connection changes'
        ]
      });
    }

    // Performance insights
    if (hybridMetrics.priorAuthMetrics.avgProcessingTimeHours > 72) {
      insights.push({
        type: 'opportunity',
        severity: 'medium',
        title: 'Prior Authorization Processing Time Optimization',
        description: `Average processing time of ${hybridMetrics.priorAuthMetrics.avgProcessingTimeHours.toFixed(1)} hours exceeds target.`,
        dataSource: 'hybrid',
        recommendedActions: [
          'Implement automated decision rules',
          'Review bottlenecks in approval workflow',
          'Consider AI-assisted pre-authorization'
        ]
      });
    }

    // Cross-provider comparison insights
    const providerComparisons = await crossProviderAnalyticsService.getProviderComparison(
      organizationIds,
      timeframe
    );

    const topPerformer = providerComparisons[0];
    const bottomPerformer = providerComparisons[providerComparisons.length - 1];

    if (topPerformer && bottomPerformer && providerComparisons.length > 1) {
      const performanceGap = topPerformer.metrics.approvalRate - bottomPerformer.metrics.approvalRate;

      if (performanceGap > 20) {
        insights.push({
          type: 'opportunity',
          severity: 'high',
          title: 'Significant Provider Performance Gap',
          description: `${performanceGap.toFixed(1)}% approval rate difference between top and bottom performers.`,
          dataSource: 'hybrid',
          recommendedActions: [
            'Share best practices from top performers',
            'Provide targeted training for underperforming providers',
            'Analyze workflow differences'
          ],
          affectedOrganizations: [bottomPerformer.organizationId]
        });
      }
    }

    // Trend analysis insights
    const trendInsights = await this.analyzeTrends(organizationIds, timeframe);
    insights.push(...trendInsights);

    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeDashboardMetrics(organizationIds: string[]): Promise<{
    currentMetrics: any;
    alerts: AnalyticsInsight[];
    systemHealth: {
      localSystem: number;
      healthLakeSync: number;
      overall: number;
    };
  }> {
    const currentTimeframe: AnalyticsTimeframe = {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      to: new Date(),
      aggregationType: 'daily'
    };

    const hybridMetrics = await this.getHybridCrossProviderAnalytics(organizationIds, currentTimeframe);
    const insights = await this.generateAdvancedInsights(organizationIds, currentTimeframe);

    // Get critical alerts only
    const alerts = insights.filter(insight =>
      insight.severity === 'critical' || insight.severity === 'high'
    );

    // Calculate system health scores
    const systemHealth = {
      localSystem: this.calculateLocalSystemHealth(hybridMetrics),
      healthLakeSync: this.calculateHealthLakeSyncHealth(hybridMetrics),
      overall: 0
    };

    systemHealth.overall = (systemHealth.localSystem + systemHealth.healthLakeSync) / 2;

    return {
      currentMetrics: hybridMetrics,
      alerts,
      systemHealth
    };
  }

  // Private helper methods

  private async getHealthLakeAnalytics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<Partial<CrossProviderMetrics>> {
    // HealthLake doesn't have direct analytics API, so we'd need to:
    // 1. Export data to S3
    // 2. Process exported NDJSON files
    // 3. Calculate metrics

    // For now, return placeholder that would be populated by actual HealthLake data processing
    return {
      totalProviders: organizationIds.length,
      totalPatients: 0, // Would be calculated from exported data
      totalEncounters: 0,
      priorAuthMetrics: {
        total: 0,
        approved: 0,
        denied: 0,
        pending: 0,
        approvalRate: 0,
        avgProcessingTimeHours: 0
      },
      documentMetrics: {
        total: 0,
        processed: 0,
        failed: 0,
        processingRate: 0,
        avgProcessingTimeMinutes: 0
      },
      ehrMetrics: {
        totalConnections: 0,
        activeConnections: 0,
        syncedResources: 0,
        syncErrors: 0,
        lastSyncStatus: {}
      },
      systemMetrics: {
        uptime: 99.9,
        avgResponseTime: 200,
        errorRate: 0.1
      }
    };
  }

  private async mergeMetrics(
    localMetrics: CrossProviderMetrics,
    healthLakeMetrics: Partial<CrossProviderMetrics>,
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<HybridMetrics> {
    // Use HealthLake data as primary if prioritized and available, otherwise local
    const primarySource = this.config.prioritizeHealthLakeData && healthLakeMetrics.totalPatients
      ? healthLakeMetrics
      : localMetrics;

    const secondarySource = primarySource === localMetrics ? healthLakeMetrics : localMetrics;

    // Merge with intelligent fallback
    const merged: HybridMetrics = {
      ...localMetrics,
      totalPatients: primarySource.totalPatients || secondarySource.totalPatients || 0,
      totalEncounters: primarySource.totalEncounters || secondarySource.totalEncounters || 0,
      priorAuthMetrics: {
        ...localMetrics.priorAuthMetrics,
        ...primarySource.priorAuthMetrics,
        // Use secondary source for missing values
        total: primarySource.priorAuthMetrics?.total || secondarySource.priorAuthMetrics?.total || 0
      },
      dataSource: {
        local: {
          enabled: true,
          resourceCount: 0,
          lastSyncAt: null
        },
        healthLake: {
          enabled: this.config.enableHealthLakeAnalytics,
          datastoreStatus: 'unknown',
          resourceCount: 0,
          lastExportAt: null
        }
      },
      dataQuality: {
        completeness: 0,
        consistency: 0,
        duplicates: 0,
        conflicts: 0
      },
      recommendations: {
        dataSync: [],
        quality: [],
        performance: []
      }
    };

    return merged;
  }

  private async calculateDataQuality(
    organizationIds: string[],
    localMetrics: CrossProviderMetrics,
    healthLakeMetrics: Partial<CrossProviderMetrics>
  ): Promise<HybridMetrics['dataQuality']> {
    // Calculate completeness based on expected vs actual data
    const expectedResources = await this.calculateExpectedResourceCount(organizationIds);
    const actualResources = await this.getLocalResourceCount(organizationIds);
    const completeness = expectedResources > 0 ? (actualResources / expectedResources) * 100 : 100;

    // Calculate consistency by comparing local vs HealthLake metrics
    const keyMetrics = ['totalPatients', 'totalEncounters'];
    let consistencyScore = 100;

    for (const metric of keyMetrics) {
      const localValue = this.getNestedValue(localMetrics, metric) || 0;
      const healthLakeValue = this.getNestedValue(healthLakeMetrics, metric) || 0;

      if (localValue > 0 && healthLakeValue > 0) {
        const difference = Math.abs(localValue - healthLakeValue);
        const percentDiff = (difference / Math.max(localValue, healthLakeValue)) * 100;
        consistencyScore -= Math.min(percentDiff, 20); // Max 20 point deduction per metric
      }
    }

    // Calculate duplicates and conflicts (simplified)
    const duplicates = await this.findDuplicateResources(organizationIds);
    const conflicts = await this.findDataConflicts(organizationIds);

    return {
      completeness: Math.max(0, Math.min(100, completeness)),
      consistency: Math.max(0, Math.min(100, consistencyScore)),
      duplicates,
      conflicts
    };
  }

  private generateHybridRecommendations(metrics: HybridMetrics): HybridMetrics['recommendations'] {
    const recommendations = {
      dataSync: [] as string[],
      quality: [] as string[],
      performance: [] as string[]
    };

    // Data sync recommendations
    if (metrics.dataQuality.completeness < 85) {
      recommendations.dataSync.push('Increase EHR sync frequency to improve data completeness');
    }

    if (metrics.dataQuality.consistency < 90) {
      recommendations.dataSync.push('Review data transformation logic for consistency issues');
    }

    // Quality recommendations
    if (metrics.dataQuality.duplicates > 100) {
      recommendations.quality.push('Implement duplicate detection and resolution processes');
    }

    if (metrics.dataQuality.conflicts > 50) {
      recommendations.quality.push('Establish data governance rules for conflict resolution');
    }

    // Performance recommendations
    if (metrics.priorAuthMetrics.approvalRate < 80) {
      recommendations.performance.push('Optimize prior authorization workflows to improve approval rates');
    }

    if (metrics.documentMetrics.processingRate < 95) {
      recommendations.performance.push('Enhance document processing automation');
    }

    return recommendations;
  }

  private async analyzeTrends(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // This would involve comparing current period vs previous periods
    // For now, return placeholder insights

    return insights;
  }

  private calculateLocalSystemHealth(metrics: HybridMetrics): number {
    let score = 100;

    // Deduct points for various issues
    if (metrics.dataQuality.completeness < 90) score -= 20;
    if (metrics.priorAuthMetrics.approvalRate < 80) score -= 15;
    if (metrics.documentMetrics.processingRate < 95) score -= 10;
    if (metrics.systemMetrics.errorRate > 1) score -= 20;

    return Math.max(0, score);
  }

  private calculateHealthLakeSyncHealth(metrics: HybridMetrics): number {
    if (!metrics.dataSource.healthLake.enabled) return 0;

    let score = 100;

    if (metrics.dataSource.healthLake.datastoreStatus !== 'ACTIVE') score -= 50;
    if (metrics.dataQuality.consistency < 90) score -= 30;
    if (metrics.dataQuality.conflicts > 100) score -= 20;

    return Math.max(0, score);
  }

  private convertToHybridMetrics(localMetrics: CrossProviderMetrics, organizationIds: string[]): HybridMetrics {
    return {
      ...localMetrics,
      dataSource: {
        local: {
          enabled: true,
          resourceCount: 0,
          lastSyncAt: new Date()
        },
        healthLake: {
          enabled: false,
          datastoreStatus: 'disabled',
          resourceCount: 0,
          lastExportAt: null
        }
      },
      dataQuality: {
        completeness: 95, // Assume good quality for local-only
        consistency: 100,
        duplicates: 0,
        conflicts: 0
      },
      recommendations: {
        dataSync: ['Consider enabling HealthLake integration for enhanced analytics'],
        quality: [],
        performance: []
      }
    };
  }

  // Utility methods

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.config.cacheTimeoutMinutes * 60 * 1000) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateComparisonRecommendation(metricKey: string, percentageDiff: number): string {
    if (Math.abs(percentageDiff) < 5) return 'Data sources are well aligned';
    if (percentageDiff > 10) return 'HealthLake shows higher values - verify sync completeness';
    if (percentageDiff < -10) return 'Local system shows higher values - check HealthLake data quality';
    return 'Minor discrepancy - monitor trends';
  }

  private async getLocalResourceCount(organizationIds: string[]): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(fhirResources)
      .where(inArray(fhirResources.organizationId, organizationIds));

    return result?.count || 0;
  }

  private async getHealthLakeResourceCount(organizationIds: string[]): Promise<number> {
    // This would query HealthLake or use cached export data
    return 0; // Placeholder
  }

  private async getLastLocalSyncTime(organizationIds: string[]): Promise<Date | null> {
    const [result] = await db
      .select({ lastSync: sql<Date | null>`MAX(${fhirResources.lastSyncAt})` })
      .from(fhirResources)
      .where(inArray(fhirResources.organizationId, organizationIds));

    return result?.lastSync ? new Date(result.lastSync) : null;
  }

  private async getLastHealthLakeExportTime(): Promise<Date | null> {
    // This would check the most recent export job completion time
    return null; // Placeholder
  }

  private async calculateExpectedResourceCount(organizationIds: string[]): Promise<number> {
    // This would calculate expected resources based on patients, encounters, etc.
    const [patientsVal] = await db
      .select({ count: count() })
      .from(patients)
      .where(inArray(patients.organizationId, organizationIds));

    const [encountersVal] = await db
      .select({ count: count() })
      .from(encounters)
      .where(inArray(encounters.organizationId, organizationIds));

    // Rough estimate: 1 patient resource + average 3 encounters per patient
    return (patientsVal?.count ?? 0) + (encountersVal?.count ?? 0);
  }

  private async findDuplicateResources(organizationIds: string[]): Promise<number> {
    // Implementation would find duplicate FHIR resources
    return 0; // Placeholder
  }

  private async findDataConflicts(organizationIds: string[]): Promise<number> {
    // Implementation would find conflicting data between sources
    return 0; // Placeholder
  }
}

export function createHybridAnalyticsService(config?: Partial<HybridAnalyticsConfig>): HybridAnalyticsService {
  const defaultConfig: HybridAnalyticsConfig = {
    healthLakeDatastoreId: process.env.HEALTHLAKE_DATASTORE_ID || '',
    enableHealthLakeAnalytics: process.env.ENABLE_HEALTHLAKE_ANALYTICS === 'true',
    prioritizeHealthLakeData: process.env.PRIORITIZE_HEALTHLAKE_DATA === 'true',
    fallbackToLocal: true,
    cacheTimeoutMinutes: 30
  };

  return new HybridAnalyticsService({ ...defaultConfig, ...config });
}

export const hybridAnalyticsService = createHybridAnalyticsService();

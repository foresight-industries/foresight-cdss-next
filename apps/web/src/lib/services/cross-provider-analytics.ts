import { db } from '@foresight-cdss-next/db';
import {
  crossProviderAnalytics,
  fhirResources,
  ehrSyncJobs,
  ehrConnections,
  patients,
  encounters,
  priorAuths as priorAuthorizations,
  documents,
  organizations,
  type CrossProviderAnalytics,
  type NewCrossProviderAnalytics
} from '@foresight-cdss-next/db/schema';
import { eq, and, gte, lte, inArray, count, avg, sql } from 'drizzle-orm';

export interface AnalyticsTimeframe {
  from: Date;
  to: Date;
  aggregationType: 'daily' | 'weekly' | 'monthly';
}

export interface CrossProviderMetrics {
  // Provider Overview
  totalProviders: number;
  activeProviders: number;
  newProviders: number;

  // Patient Metrics
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  avgPatientsPerProvider: number;

  // Encounter Metrics
  totalEncounters: number;
  encounterTypes: Record<string, number>;
  avgEncountersPerPatient: number;
  avgEncounterDuration: number;

  // Prior Authorization Performance
  priorAuthMetrics: {
    total: number;
    approved: number;
    denied: number;
    pending: number;
    approvalRate: number;
    avgProcessingTimeHours: number;
  };

  // Document Processing
  documentMetrics: {
    total: number;
    processed: number;
    failed: number;
    processingRate: number;
    avgProcessingTimeMinutes: number;
  };

  // EHR Integration Health
  ehrMetrics: {
    totalConnections: number;
    activeConnections: number;
    syncedResources: number;
    syncErrors: number;
    lastSyncStatus: Record<string, number>;
  };

  // Performance & System Health
  systemMetrics: {
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export interface ProviderComparison {
  organizationId: string;
  organizationName: string;
  metrics: {
    patients: number;
    encounters: number;
    priorAuths: number;
    approvalRate: number;
    avgProcessingTime: number;
    documentProcessingRate: number;
    ehrSyncHealth: number;
  };
  rank: number;
  trendsVsPrevious: Record<string, number>; // percentage changes
}

export class CrossProviderAnalyticsService {

  /**
   * Calculate and store cross-provider analytics for a given timeframe
   */
  async calculateCrossProviderMetrics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<CrossProviderMetrics> {
    const metrics = await this.gatherMetrics(organizationIds, timeframe);

    // Store calculated metrics
    await this.storeCrossProviderAnalytics(organizationIds, timeframe, metrics);

    return metrics;
  }

  /**
   * Get cross-provider analytics for display
   */
  async getCrossProviderAnalytics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<CrossProviderMetrics> {
    // Try to get from stored analytics first
    const stored = await this.getStoredAnalytics(organizationIds, timeframe);

    if (stored && this.isAnalyticsRecent(stored)) {
      return this.convertStoredToMetrics(stored);
    }

    // Calculate fresh if not available or stale
    return await this.calculateCrossProviderMetrics(organizationIds, timeframe);
  }

  /**
   * Compare provider performance
   */
  async getProviderComparison(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<ProviderComparison[]> {
    const comparisons: ProviderComparison[] = [];

    for (const orgId of organizationIds) {
      const orgMetrics = await this.getProviderMetrics(orgId, timeframe);
      const previousMetrics = await this.getProviderMetrics(
        orgId,
        this.getPreviousTimeframe(timeframe)
      );

      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      comparisons.push({
        organizationId: orgId,
        organizationName: org?.name || 'Unknown',
        metrics: orgMetrics,
        rank: 0, // Will be calculated after sorting
        trendsVsPrevious: this.calculateTrends(orgMetrics, previousMetrics)
      });
    }

    // Rank providers by overall performance score
    const rankedComparisons = this.rankProviders(comparisons);

    return rankedComparisons;
  }

  /**
   * Get provider-specific metrics
   */
  async getProviderMetrics(organizationId: string, timeframe: AnalyticsTimeframe) {
    const { from, to } = timeframe;

    // Patient metrics
    const [patientCount] = await db
      .select({ count: count() })
      .from(patients)
      .where(and(
        eq(patients.organizationId, organizationId),
        gte(patients.createdAt, from),
        lte(patients.createdAt, to)
      ));

    // Encounter metrics
    const [encounterCount] = await db
      .select({ count: count() })
      .from(encounters)
      .where(and(
        eq(encounters.organizationId, organizationId),
        gte(encounters.createdAt, from),
        lte(encounters.createdAt, to)
      ));

    // Prior auth metrics
    const priorAuthStats = await db
      .select({
        total: count(),
        approved: count(sql`CASE WHEN ${priorAuthorizations.status} = 'approved' THEN 1 END`),
        avgProcessingTime: avg(sql`EXTRACT(EPOCH FROM (${priorAuthorizations.updatedAt} - ${priorAuthorizations.createdAt})) / 3600`)
      })
      .from(priorAuthorizations)
      .where(and(
        eq(priorAuthorizations.organizationId, organizationId),
        gte(priorAuthorizations.createdAt, from),
        lte(priorAuthorizations.createdAt, to)
      ));

    // Document processing rate
    const docStats = await db
      .select({
        total: count(),
        processed: count(sql`CASE WHEN ${documents.processingStatus} = 'processed' THEN 1 END`)
      })
      .from(documents)
      .where(and(
        eq(documents.organizationId, organizationId),
        gte(documents.createdAt, from),
        lte(documents.createdAt, to)
      ));

    // EHR sync health
    const ehrHealth = await this.calculateEHRSyncHealth(organizationId, timeframe);

    const totalPriorAuths = priorAuthStats[0]?.total || 0;
    const approvedPriorAuths = priorAuthStats[0]?.approved || 0;
    const totalDocs = docStats[0]?.total || 0;
    const processedDocs = docStats[0]?.processed || 0;

    return {
      patients: patientCount?.count || 0,
      encounters: encounterCount?.count || 0,
      priorAuths: totalPriorAuths,
      approvalRate: totalPriorAuths > 0 ? (approvedPriorAuths / totalPriorAuths) * 100 : 0,
      avgProcessingTime: Number(priorAuthStats[0]?.avgProcessingTime) || 0,
      documentProcessingRate: totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0,
      ehrSyncHealth: ehrHealth
    };
  }

  /**
   * Get trending data over time
   */
  async getTrendingAnalytics(
    organizationIds: string[],
    periods: AnalyticsTimeframe[]
  ): Promise<Array<{ period: string; metrics: CrossProviderMetrics }>> {
    const trends = [];

    for (const period of periods) {
      const metrics = await this.getCrossProviderAnalytics(organizationIds, period);
      trends.push({
        period: this.formatPeriod(period),
        metrics
      });
    }

    return trends;
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<{
    summary: string;
    keyMetrics: Record<string, number>;
    insights: string[];
    recommendations: string[];
  }> {
    const metrics = await this.getCrossProviderAnalytics(organizationIds, timeframe);
    const comparisons = await this.getProviderComparison(organizationIds, timeframe);

    const keyMetrics = {
      'Total Providers': metrics.totalProviders,
      'Total Patients': metrics.totalPatients,
      'PA Approval Rate': metrics.priorAuthMetrics.approvalRate,
      'Avg Processing Time (hrs)': metrics.priorAuthMetrics.avgProcessingTimeHours,
      'Document Processing Rate': metrics.documentMetrics.processingRate,
      'EHR Sync Health': (metrics.ehrMetrics.activeConnections / Math.max(metrics.ehrMetrics.totalConnections, 1)) * 100
    };

    const insights = this.generateInsights(metrics, comparisons);
    const recommendations = this.generateRecommendations(metrics, comparisons);

    const summary = this.generateSummaryText(metrics, keyMetrics);

    return {
      summary,
      keyMetrics,
      insights,
      recommendations
    };
  }

  // Private helper methods

  private async gatherMetrics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<CrossProviderMetrics> {
    const { from, to } = timeframe;

    // Provider metrics
    const [providerStats] = await db
      .select({
        totalProviders: count(),
        activeProviders: count(sql`CASE WHEN ${organizations.status} = 'active' THEN 1 END`)
      })
      .from(organizations)
      .where(inArray(organizations.id, organizationIds));

    // Patient metrics
    const [patientStats] = await db
      .select({
        total: count(),
        newPatients: count(sql`CASE WHEN ${patients.createdAt} >= ${from} THEN 1 END`)
      })
      .from(patients)
      .where(inArray(patients.organizationId, organizationIds));

    // Encounter metrics
    const encounterStats = await db
      .select({
        total: count(),
        avgDuration: avg(sql`EXTRACT(EPOCH FROM (${encounters.endTime} - ${encounters.startTime})) / 60`)
      })
      .from(encounters)
      .where(and(
        inArray(encounters.organizationId, organizationIds),
        gte(encounters.createdAt, from),
        lte(encounters.createdAt, to)
      ));

    // Prior auth metrics
    const [priorAuthStats] = await db
      .select({
        total: count(),
        approved: count(sql`CASE WHEN ${priorAuthorizations.status} = 'approved' THEN 1 END`),
        denied: count(sql`CASE WHEN ${priorAuthorizations.status} = 'denied' THEN 1 END`),
        pending: count(sql`CASE WHEN ${priorAuthorizations.status} = 'pending' THEN 1 END`),
        avgProcessingTime: avg(sql`EXTRACT(EPOCH FROM (${priorAuthorizations.updatedAt} - ${priorAuthorizations.createdAt})) / 3600`)
      })
      .from(priorAuthorizations)
      .where(and(
        inArray(priorAuthorizations.organizationId, organizationIds),
        gte(priorAuthorizations.createdAt, from),
        lte(priorAuthorizations.createdAt, to)
      ));

    // Document metrics
    const [docStats] = await db
      .select({
        total: count(),
        processed: count(sql`CASE WHEN ${documents.isProcessed} THEN 1 END`),
        failed: count(sql`CASE WHEN ${documents.processingStatus} = 'failed' THEN 1 END`)
      })
      .from(documents)
      .where(and(
        inArray(documents.organizationId, organizationIds),
        gte(documents.createdAt, from),
        lte(documents.createdAt, to)
      ));

    // EHR metrics
    const ehrStats = await this.getEHRMetrics(organizationIds, timeframe);

    const totalPriorAuths = priorAuthStats?.total || 0;
    const approvedPriorAuths = priorAuthStats?.approved || 0;
    const totalDocs = docStats?.total || 0;
    const processedDocs = docStats?.processed || 0;

    return {
      totalProviders: providerStats?.totalProviders || 0,
      activeProviders: providerStats?.activeProviders || 0,
      newProviders: 0, // Would need date-based logic

      totalPatients: patientStats?.total || 0,
      newPatients: patientStats?.newPatients || 0,
      activePatients: 0, // Would need activity-based logic
      avgPatientsPerProvider: (patientStats?.total || 0) / Math.max(providerStats?.totalProviders || 1, 1),

      totalEncounters: encounterStats[0]?.total || 0,
      encounterTypes: {}, // Would need grouping logic
      avgEncountersPerPatient: 0, // Would need calculation
      avgEncounterDuration: Number(encounterStats[0]?.avgDuration) || 0,

      priorAuthMetrics: {
        total: totalPriorAuths,
        approved: approvedPriorAuths,
        denied: priorAuthStats?.denied || 0,
        pending: priorAuthStats?.pending || 0,
        approvalRate: totalPriorAuths > 0 ? (approvedPriorAuths / totalPriorAuths) * 100 : 0,
        avgProcessingTimeHours: Number(priorAuthStats?.avgProcessingTime) || 0
      },

      documentMetrics: {
        total: totalDocs,
        processed: processedDocs,
        failed: docStats?.failed || 0,
        processingRate: totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0,
        avgProcessingTimeMinutes: 0 // Would need timing data
      },

      ehrMetrics: ehrStats,

      systemMetrics: {
        uptime: 99.9, // Would integrate with monitoring
        avgResponseTime: 250, // Would integrate with APM
        errorRate: 0.1 // Would integrate with error tracking
      }
    };
  }

  private async getEHRMetrics(organizationIds: string[], timeframe: AnalyticsTimeframe) {
    const [connectionStats] = await db
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${ehrConnections.isActive} THEN 1 END`)
      })
      .from(ehrConnections)
      .where(inArray(ehrConnections.organizationId, organizationIds));

    const [syncStats] = await db
      .select({
        synced: count(sql`CASE WHEN ${fhirResources.syncStatus} = 'synced' THEN 1 END`),
        errors: count(sql`CASE WHEN ${fhirResources.syncStatus} = 'error' THEN 1 END`)
      })
      .from(fhirResources)
      .where(inArray(fhirResources.organizationId, organizationIds));

    return {
      totalConnections: connectionStats?.total || 0,
      activeConnections: connectionStats?.active || 0,
      syncedResources: syncStats?.synced || 0,
      syncErrors: syncStats?.errors || 0,
      lastSyncStatus: {} // Would need detailed sync status breakdown
    };
  }

  private async calculateEHRSyncHealth(organizationId: string, timeframe: AnalyticsTimeframe): Promise<number> {
    const [stats] = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${ehrSyncJobs.status} = 'completed' THEN 1 END`)
      })
      .from(ehrSyncJobs)
      .where(and(
        eq(ehrSyncJobs.organizationId, organizationId),
        gte(ehrSyncJobs.createdAt, timeframe.from),
        lte(ehrSyncJobs.createdAt, timeframe.to)
      ));

    const total = stats?.total || 0;
    const successful = stats?.successful || 0;

    return total > 0 ? (successful / total) * 100 : 100;
  }

  private async storeCrossProviderAnalytics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe,
    metrics: CrossProviderMetrics
  ): Promise<void> {
    const analyticsData: NewCrossProviderAnalytics = {
      aggregationType: timeframe.aggregationType,
      aggregationDate: new Date(timeframe.from).toISOString().split('T')[0],
      organizationIds,
      totalProviders: metrics.totalProviders,
      totalPatients: metrics.totalPatients,
      newPatients: metrics.newPatients,
      activePatients: metrics.activePatients,
      totalEncounters: metrics.totalEncounters,
      totalPriorAuths: metrics.priorAuthMetrics.total,
      approvedPriorAuths: metrics.priorAuthMetrics.approved,
      deniedPriorAuths: metrics.priorAuthMetrics.denied,
      pendingPriorAuths: metrics.priorAuthMetrics.pending,
      averageProcessingTime: Math.round(metrics.priorAuthMetrics.avgProcessingTimeHours),
      totalDocuments: metrics.documentMetrics.total,
      processedDocuments: metrics.documentMetrics.processed,
      failedDocuments: metrics.documentMetrics.failed,
      activeEhrConnections: metrics.ehrMetrics.activeConnections,
      syncedResources: metrics.ehrMetrics.syncedResources,
      syncErrors: metrics.ehrMetrics.syncErrors,
      systemUptime: metrics.systemMetrics.uptime.toString(),
      averageResponseTime: metrics.systemMetrics.avgResponseTime,
      calculatedAt: new Date()
    };

    await db.insert(crossProviderAnalytics).values(analyticsData);
  }

  private async getStoredAnalytics(
    organizationIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<CrossProviderAnalytics | null> {
    const [stored] = await db
      .select()
      .from(crossProviderAnalytics)
      .where(and(
        eq(crossProviderAnalytics.aggregationType, timeframe.aggregationType),
        eq(crossProviderAnalytics.aggregationDate, new Date(timeframe.from).toISOString().split('T')[0])
      ))
      .orderBy(sql`ORDER BY ${crossProviderAnalytics.calculatedAt} DESC`)
      .limit(1);

    return stored || null;
  }

  private isAnalyticsRecent(analytics: CrossProviderAnalytics): boolean {
    const hoursOld = (Date.now() - analytics.calculatedAt.getTime()) / (1000 * 60 * 60);
    return hoursOld < 6; // Consider fresh if less than 6 hours old
  }

  private convertStoredToMetrics(stored: CrossProviderAnalytics): CrossProviderMetrics {
    if (!stored) {
      return {
        totalProviders: 0,
        activeProviders: 0,
        newProviders: 0,
        totalPatients: 0,
        newPatients: 0,
        activePatients: 0,
        avgPatientsPerProvider: 0,
        totalEncounters: 0,
        encounterTypes: {},
        avgEncountersPerPatient: 0,
        avgEncounterDuration: 0,
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
          avgResponseTime: 250,
          errorRate: 0
        }
      };
    }

    return {
      totalProviders: stored.totalProviders,
      activeProviders: stored.totalProviders, // Approximation
      newProviders: 0,
      totalPatients: Number(stored.totalPatients),
      newPatients: Number(stored.newPatients),
      activePatients: Number(stored.activePatients),
      avgPatientsPerProvider: Number(stored.totalPatients) / Math.max(stored.totalProviders, 1),
      totalEncounters: Number(stored.totalEncounters),
      encounterTypes: {},
      avgEncountersPerPatient: 0,
      avgEncounterDuration: 0,
      priorAuthMetrics: {
        total: Number(stored.totalPriorAuths),
        approved: Number(stored.approvedPriorAuths),
        denied: Number(stored.deniedPriorAuths),
        pending: Number(stored.pendingPriorAuths),
        approvalRate: Number(stored.totalPriorAuths) > 0 ? (Number(stored.approvedPriorAuths) / Number(stored.totalPriorAuths)) * 100 : 0,
        avgProcessingTimeHours: stored.averageProcessingTime || 0
      },
      documentMetrics: {
        total: Number(stored.totalDocuments),
        processed: Number(stored.processedDocuments),
        failed: Number(stored.failedDocuments),
        processingRate: Number(stored.totalDocuments) > 0 ? (Number(stored.processedDocuments) / Number(stored.totalDocuments)) * 100 : 0,
        avgProcessingTimeMinutes: 0
      },
      ehrMetrics: {
        totalConnections: Number(stored.activeEhrConnections),
        activeConnections: Number(stored.activeEhrConnections),
        syncedResources: Number(stored.syncedResources),
        syncErrors: Number(stored.syncErrors),
        lastSyncStatus: {}
      },
      systemMetrics: {
        uptime: Number(stored.systemUptime) || 99.9,
        avgResponseTime: stored.averageResponseTime || 0,
        errorRate: 0
      }
    };
  }

  private getPreviousTimeframe(timeframe: AnalyticsTimeframe): AnalyticsTimeframe {
    const duration = timeframe.to.getTime() - timeframe.from.getTime();
    return {
      from: new Date(timeframe.from.getTime() - duration),
      to: new Date(timeframe.to.getTime() - duration),
      aggregationType: timeframe.aggregationType
    };
  }

  private calculateTrends(current: any, previous: any): Record<string, number> {
    const trends: Record<string, number> = {};

    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
        const change = previous[key] > 0 ? ((current[key] - previous[key]) / previous[key]) * 100 : 0;
        trends[key] = change;
      }
    });

    return trends;
  }

  private rankProviders(comparisons: ProviderComparison[]): ProviderComparison[] {
    // Calculate composite score for ranking
    const scored = comparisons.map(comp => ({
      ...comp,
      score: this.calculatePerformanceScore(comp.metrics)
    }));

    // Sort by score and assign ranks
    scored.sort((a, b) => b.score - a.score);

    return scored.map((comp, index) => ({
      ...comp,
      rank: index + 1
    }));
  }

  private calculatePerformanceScore(metrics: any): number {
    // Weighted scoring algorithm
    const weights = {
      approvalRate: 0.3,
      documentProcessingRate: 0.25,
      ehrSyncHealth: 0.2,
      avgProcessingTime: -0.15, // Negative because lower is better
      patients: 0.1
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (metrics[key] !== undefined) {
        score += metrics[key] * weight;
      }
    });

    return Math.max(0, score);
  }

  private formatPeriod(timeframe: AnalyticsTimeframe): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `${formatter.format(timeframe.from)} - ${formatter.format(timeframe.to)}`;
  }

  private generateInsights(metrics: CrossProviderMetrics, comparisons: ProviderComparison[]): string[] {
    const insights = [];

    if (metrics.priorAuthMetrics.approvalRate > 85) {
      insights.push('Prior authorization approval rates are performing well above industry average');
    } else if (metrics.priorAuthMetrics.approvalRate < 70) {
      insights.push('Prior authorization approval rates need improvement - consider workflow optimization');
    }

    if (metrics.documentMetrics.processingRate < 90) {
      insights.push('Document processing has room for improvement - consider automation enhancements');
    }

    const topPerformer = comparisons[0];
    if (topPerformer) {
      insights.push(`${topPerformer.organizationName} is the top-performing provider this period`);
    }

    return insights;
  }

  private generateRecommendations(metrics: CrossProviderMetrics, comparisons: ProviderComparison[]): string[] {
    const recommendations = [];

    if (metrics.priorAuthMetrics.avgProcessingTimeHours > 48) {
      recommendations.push('Implement automated prior authorization workflows to reduce processing time');
    }

    if (metrics.ehrMetrics.syncErrors > metrics.ehrMetrics.syncedResources * 0.1) {
      recommendations.push('Review EHR integration health - high sync error rate detected');
    }

    const lowPerformers = comparisons.filter(c => c.rank > comparisons.length * 0.7);
    if (lowPerformers.length > 0) {
      recommendations.push('Provide additional training and support to lower-performing providers');
    }

    return recommendations;
  }

  private generateSummaryText(metrics: CrossProviderMetrics, keyMetrics: Record<string, number>): string {
    return `Cross-provider analytics for ${metrics.totalProviders} healthcare providers. ` +
           `Total patients: ${metrics.totalPatients}, with ${metrics.priorAuthMetrics.total} prior authorizations ` +
           `processed at ${metrics.priorAuthMetrics.approvalRate.toFixed(1)}% approval rate. ` +
           `Average processing time: ${metrics.priorAuthMetrics.avgProcessingTimeHours.toFixed(1)} hours.`;
  }
}

export const crossProviderAnalyticsService = new CrossProviderAnalyticsService();

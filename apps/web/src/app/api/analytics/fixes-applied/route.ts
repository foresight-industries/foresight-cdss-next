import { NextRequest } from 'next/server';
import { eq, and, gte, lte, count, sum, isNotNull } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { denialTracking, denialPlaybooks } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

export interface FixAppliedAnalytics {
  resolutionMethod: string;
  totalAttempts: number;
  successfulResolutions: number;
  successRate: number;
  totalRecoveredAmount: number;
  avgRecoveryAmount: number;
  avgResolutionDays: number | null;
  entityBreakdown: {
    claims: number;
    priorAuths: number;
  };
  denialCategoriesFixed: {
    category: string;
    count: number;
  }[];
}

export interface AutomationMetrics {
  totalPlaybooks: number;
  activePlaybooks: number;
  automatedResolutions: number;
  manualResolutions: number;
  automationRate: number;
  topAutomatedFixes: {
    method: string;
    count: number;
    successRate: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return Response.json({ error: 'organizationId is required' }, { status: 400 });
    }

    let whereConditions = [
      eq(denialTracking.organizationId, organizationId),
      isNotNull(denialTracking.resolutionMethod) // Only resolved denials
    ];
    
    if (startDate) {
      whereConditions.push(gte(denialTracking.denialDate, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(denialTracking.denialDate, endDate));
    }

    // Get fixes applied analytics
    const fixesAnalytics = await db
      .select({
        resolutionMethod: denialTracking.resolutionMethod,
        totalAttempts: count(),
        totalRecoveredAmount: sum(denialTracking.resolutionAmount),
      })
      .from(denialTracking)
      .where(and(...whereConditions))
      .groupBy(denialTracking.resolutionMethod)
      .orderBy(count());

    // Get denial categories fixed by resolution method
    const categoriesFixed = await db
      .select({
        resolutionMethod: denialTracking.resolutionMethod,
        denialCategory: denialTracking.denialCategory,
        count: count()
      })
      .from(denialTracking)
      .where(and(...whereConditions))
      .groupBy(denialTracking.resolutionMethod, denialTracking.denialCategory)
      .orderBy(count());

    // Get automation metrics
    const totalPlaybooksResult = await db
      .select({ count: count() })
      .from(denialPlaybooks)
      .where(eq(denialPlaybooks.organizationId, organizationId));

    const activePlaybooksResult = await db
      .select({ count: count() })
      .from(denialPlaybooks)
      .where(and(
        eq(denialPlaybooks.organizationId, organizationId),
        eq(denialPlaybooks.isActive, true)
      ));

    // Get resolved count for each resolution method
    const resolvedCounts = await db
      .select({
        resolutionMethod: denialTracking.resolutionMethod,
        resolvedCount: count()
      })
      .from(denialTracking)
      .where(and(
        ...whereConditions,
        eq(denialTracking.status, 'resolved')
      ))
      .groupBy(denialTracking.resolutionMethod);

    // Format the analytics data
    const formattedFixesAnalytics: FixAppliedAnalytics[] = fixesAnalytics.map(row => {
      const relatedCategories = categoriesFixed
        .filter(cat => cat.resolutionMethod === row.resolutionMethod)
        .map(cat => ({
          category: cat.denialCategory,
          count: cat.count
        }));

      const resolvedCount = resolvedCounts.find(r => r.resolutionMethod === row.resolutionMethod)?.resolvedCount || 0;

      return {
        resolutionMethod: row.resolutionMethod || 'unknown',
        totalAttempts: row.totalAttempts || 0,
        successfulResolutions: resolvedCount,
        successRate: row.totalAttempts > 0 ? 
          Math.round((resolvedCount / row.totalAttempts) * 100) : 0,
        totalRecoveredAmount: Number(row.totalRecoveredAmount) || 0,
        avgRecoveryAmount: row.totalAttempts > 0 ? 
          Math.round((Number(row.totalRecoveredAmount) || 0) / row.totalAttempts) : 0,
        avgResolutionDays: null, // Simplified for now
        entityBreakdown: {
          claims: 0, // Simplified for now
          priorAuths: 0 // Simplified for now
        },
        denialCategoriesFixed: relatedCategories
      };
    });

    // Calculate automation metrics from resolution methods
    const automatedMethods = ['automated_resubmit', 'automated_appeal', 'auto_corrected_claim'];
    const automatedResolutions = formattedFixesAnalytics
      .filter(fix => automatedMethods.includes(fix.resolutionMethod))
      .reduce((sum, fix) => sum + fix.totalAttempts, 0);
    
    const totalResolutions = formattedFixesAnalytics
      .reduce((sum, fix) => sum + fix.totalAttempts, 0);
    
    const manualResolutions = totalResolutions - automatedResolutions;

    // Format automation metrics
    const automationMetrics: AutomationMetrics = {
      totalPlaybooks: totalPlaybooksResult[0]?.count || 0,
      activePlaybooks: activePlaybooksResult[0]?.count || 0,
      automatedResolutions,
      manualResolutions,
      automationRate: totalResolutions > 0 ?
        Math.round((automatedResolutions / totalResolutions) * 100) : 0,
      topAutomatedFixes: formattedFixesAnalytics
        .filter(fix => automatedMethods.includes(fix.resolutionMethod))
        .slice(0, 5)
        .map(fix => ({
          method: fix.resolutionMethod,
          count: fix.totalAttempts,
          successRate: fix.successRate
        }))
    };

    return Response.json({
      fixesApplied: formattedFixesAnalytics,
      automationMetrics
    });
  } catch (error) {
    console.error('Error fetching fixes applied analytics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
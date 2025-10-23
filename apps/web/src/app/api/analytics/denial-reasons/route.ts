import { NextRequest } from 'next/server';
import { eq, and, gte, lte, count, sum, isNotNull } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { denialTracking } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

export interface DenialReasonAnalytics {
  denialCode: string;
  denialReason: string;
  denialCategory: string;
  claimCount: number;
  priorAuthCount: number;
  totalCount: number;
  totalDeniedAmount: number;
  avgResolutionDays: number | null;
  resolutionRate: number; // Percentage of denials that were resolved
  topResolutionMethod: string | null;
  entityBreakdown: {
    claims: number;
    priorAuths: number;
  };
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
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    if (!organizationId) {
      return Response.json({ error: 'organizationId is required' }, { status: 400 });
    }

    let whereConditions = [eq(denialTracking.organizationId, organizationId)];
    
    if (startDate) {
      whereConditions.push(gte(denialTracking.denialDate, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(denialTracking.denialDate, endDate));
    }

    // Get basic denial reasons analytics
    const denialAnalytics = await db
      .select({
        denialCode: denialTracking.denialCode,
        denialReason: denialTracking.denialReason,
        denialCategory: denialTracking.denialCategory,
        totalCount: count(),
        totalDeniedAmount: sum(denialTracking.deniedAmount),
      })
      .from(denialTracking)
      .where(and(...whereConditions))
      .groupBy(
        denialTracking.denialCode,
        denialTracking.denialReason,
        denialTracking.denialCategory
      )
      .orderBy(count())
      .limit(limit);

    // Get additional metrics for each denial code separately
    const denialCodeMetrics = await Promise.all(
      denialAnalytics.map(async (denial) => {
        // Count claims vs prior auths for this denial code
        const entityCounts = await db
          .select({
            claimCount: count(denialTracking.claimId),
            priorAuthCount: count(denialTracking.priorAuthId),
          })
          .from(denialTracking)
          .where(and(
            ...whereConditions,
            eq(denialTracking.denialCode, denial.denialCode)
          ));

        // Count resolved cases
        const resolvedCount = await db
          .select({ count: count() })
          .from(denialTracking)
          .where(and(
            ...whereConditions,
            eq(denialTracking.denialCode, denial.denialCode),
            eq(denialTracking.status, 'resolved')
          ));

        // Get most common resolution method
        const topMethodResult = await db
          .select({
            resolutionMethod: denialTracking.resolutionMethod,
            count: count()
          })
          .from(denialTracking)
          .where(and(
            ...whereConditions,
            eq(denialTracking.denialCode, denial.denialCode),
            isNotNull(denialTracking.resolutionMethod)
          ))
          .groupBy(denialTracking.resolutionMethod)
          .orderBy(count())
          .limit(1);

        return {
          ...denial,
          claimCount: entityCounts[0]?.claimCount || 0,
          priorAuthCount: entityCounts[0]?.priorAuthCount || 0,
          resolvedCount: resolvedCount[0]?.count || 0,
          avgResolutionDays: null, // Simplified for now
          topResolutionMethod: topMethodResult[0]?.resolutionMethod || null,
        };
      })
    );

    const formattedAnalytics: DenialReasonAnalytics[] = denialCodeMetrics.map(row => ({
      denialCode: row.denialCode,
      denialReason: row.denialReason,
      denialCategory: row.denialCategory,
      claimCount: row.claimCount || 0,
      priorAuthCount: row.priorAuthCount || 0,
      totalCount: row.totalCount || 0,
      totalDeniedAmount: Number(row.totalDeniedAmount) || 0,
      avgResolutionDays: row.avgResolutionDays ? Math.round(row.avgResolutionDays) : null,
      resolutionRate: row.totalCount > 0 ? 
        Math.round(((row.resolvedCount || 0) / row.totalCount) * 100) : 0,
      topResolutionMethod: row.topResolutionMethod,
      entityBreakdown: {
        claims: row.claimCount || 0,
        priorAuths: row.priorAuthCount || 0
      }
    }));

    return Response.json(formattedAnalytics);
  } catch (error) {
    console.error('Error fetching denial reasons analytics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
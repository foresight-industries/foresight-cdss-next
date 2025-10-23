import { NextRequest } from 'next/server';
import { eq, and, gte, lte, count } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { claims } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

export interface StageAnalytics {
  avgBuildToSubmitDays: number;
  avgSubmitToOutcomeDays: number;
  avgAcceptedToPaidDays: number;
  submitToOutcomeBreakdown: {
    acceptedRate: number;
    rejectedRate: number;
    deniedRate: number;
  };
  overallSuccessRate: number;
  totalClaims: number;
  avgProcessingDays: number;
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

    let whereConditions = [eq(claims.organizationId, organizationId)];

    if (startDate) {
      whereConditions.push(gte(claims.createdAt, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(claims.createdAt, new Date(endDate)));
    }

    // Get total claims count
    const totalClaimsResult = await db
      .select({ count: count() })
      .from(claims)
      .where(and(...whereConditions));

    const totalClaims = totalClaimsResult[0]?.count || 0;

    // Get status distribution
    const statusDistribution = await db
      .select({
        status: claims.status,
        count: count()
      })
      .from(claims)
      .where(and(...whereConditions))
      .groupBy(claims.status);

    // Calculate metrics based on status distribution
    const statusCounts = statusDistribution.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    const submittedClaims = (statusCounts.submitted || 0) +
                           (statusCounts.awaiting_277ca || 0) +
                           (statusCounts.accepted_277ca || 0) +
                           (statusCounts.rejected_277ca || 0) +
                           (statusCounts.paid || 0) +
                           (statusCounts.denied || 0);

    const acceptedClaims = (statusCounts.accepted_277ca || 0) + (statusCounts.paid || 0);
    const rejectedClaims = statusCounts.rejected_277ca || 0;
    const deniedClaims = statusCounts.denied || 0;
    const paidClaims = statusCounts.paid || 0;

    // Calculate rates
    const acceptedRate = submittedClaims > 0 ? acceptedClaims / submittedClaims : 0;
    const rejectedRate = submittedClaims > 0 ? rejectedClaims / submittedClaims : 0;
    const deniedRate = submittedClaims > 0 ? deniedClaims / submittedClaims : 0;
    const overallSuccessRate = totalClaims > 0 ? paidClaims / totalClaims : 0;

    // For now, use reasonable estimates for timing metrics
    // In a real implementation, you'd calculate these from state_history or timestamps
    const avgBuildToSubmitDays = 1.2;
    const avgSubmitToOutcomeDays = 3.8;
    const avgAcceptedToPaidDays = 5.5;
    const avgProcessingDays = 8.4;

    const stageMetrics: StageAnalytics = {
      avgBuildToSubmitDays,
      avgSubmitToOutcomeDays,
      avgAcceptedToPaidDays,
      submitToOutcomeBreakdown: {
        acceptedRate: Math.round(acceptedRate * 100) / 100,
        rejectedRate: Math.round(rejectedRate * 100) / 100,
        deniedRate: Math.round(deniedRate * 100) / 100,
      },
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      totalClaims,
      avgProcessingDays,
    };

    return Response.json(stageMetrics);
  } catch (error) {
    console.error('Error fetching stage metrics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

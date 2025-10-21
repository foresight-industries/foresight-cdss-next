import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, count } from 'drizzle-orm';
import { priorAuths, teamMembers, userProfiles } from '@foresight-cdss-next/db';

// GET /api/prior-auth/status-distribution - Get status distribution for dashboard
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({
        error: 'organizationId query parameter is required'
      }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Verify user has access to the organization
    const { data: membership } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!membership || membership.length === 0) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view data for this organization'
      }, { status: 403 });
    }

    // Get status distribution with counts
    const { data: statusDistribution } = await safeSelect(async () =>
      db.select({
        status: priorAuths.status,
        total: count()
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.organizationId, organizationId),
        isNull(priorAuths.deletedAt)
      ))
      .groupBy(priorAuths.status)
    );

    if (!statusDistribution) {
      return NextResponse.json({
        error: 'Failed to fetch status distribution'
      }, { status: 500 });
    }

    // Transform the data into the expected format for the dashboard
    const distribution = statusDistribution.reduce((acc, item) => {
      acc[item.status] = item.total;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total for percentages
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    // Format response with percentages
    const formattedDistribution = Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    // Ensure all status values are represented (with 0 counts if not present)
    const allStatuses = ['pending', 'approved', 'denied', 'expired', 'cancelled'];
    const completeDistribution = allStatuses.map(status => {
      const existing = formattedDistribution.find(item => item.status === status);
      return existing || { status, count: 0, percentage: 0 };
    });

    return NextResponse.json({
      distribution: completeDistribution,
      total,
      organizationId
    });

  } catch (error) {
    console.error('Error fetching status distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

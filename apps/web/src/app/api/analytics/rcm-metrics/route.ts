import { NextRequest } from 'next/server';
import { eq, and, gte, lte, sql, not, inArray } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { claims } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

export interface AgingBuckets {
  '0-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
}

export interface RCMMetrics {
  daysInAR: number | null;
  maxDaysOutstanding: number | null;
  agingBuckets: AgingBuckets;
  agingCounts: AgingBuckets;
  totalOutstandingAR: number;
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
      eq(claims.organizationId, organizationId),
      // Exclude denied and paid claims from AR calculations
      not(inArray(claims.status, ['denied', 'paid']))
    ];

    if (startDate) {
      whereConditions.push(gte(claims.createdAt, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(claims.createdAt, new Date(endDate)));
    }

    // Get outstanding claims with age calculation
    const outstandingClaims = await db
      .select({
        id: claims.id,
        dateOfService: claims.serviceDate,
        totalAmount: claims.totalCharges,
        status: claims.status,
        createdAt: claims.createdAt,
        // Calculate days since DOS
        daysOutstanding: sql<number>`(CURRENT_DATE - ${claims.serviceDate})`
      })
      .from(claims)
      .where(and(...whereConditions));

    if (outstandingClaims.length === 0) {
      return Response.json({
        daysInAR: null,
        maxDaysOutstanding: null,
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        totalOutstandingAR: 0
      });
    }

    // Calculate metrics
    let totalDays = 0;
    let maxDays = 0;
    let totalAmount = 0;
    const buckets: AgingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const counts: AgingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

    for (const claim of outstandingClaims) {
      const daysOld = claim.daysOutstanding || 0;
      const amount = Number(claim.totalAmount) || 0;

      totalDays += daysOld;
      totalAmount += amount;

      if (daysOld > maxDays) {
        maxDays = daysOld;
      }

      // Add to appropriate aging bucket
      if (daysOld <= 30) {
        buckets['0-30'] += amount;
        counts['0-30'] += 1;
      } else if (daysOld <= 60) {
        buckets['31-60'] += amount;
        counts['31-60'] += 1;
      } else if (daysOld <= 90) {
        buckets['61-90'] += amount;
        counts['61-90'] += 1;
      } else {
        buckets['90+'] += amount;
        counts['90+'] += 1;
      }
    }

    const avgDaysInAR = totalDays / outstandingClaims.length;

    const rcmMetrics: RCMMetrics = {
      daysInAR: Math.round(avgDaysInAR),
      maxDaysOutstanding: maxDays,
      agingBuckets: buckets,
      agingCounts: counts,
      totalOutstandingAR: totalAmount
    };

    return Response.json(rcmMetrics);
  } catch (error) {
    console.error('Error fetching RCM metrics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

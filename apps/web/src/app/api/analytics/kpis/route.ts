import { NextRequest } from 'next/server';
import { eq, and, gte, lte, inArray, count, countDistinct } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { claims, priorAuths } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

export interface CombinedKPIData {
  totalItems: number;
  totalClaims: number;
  totalPAs: number;
  overallAutomationRate: number;
  avgProcessingTime: number;
  patientsServed: number;
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

    // Get total PAs count from priorAuths table
    let paWhereConditions = [eq(priorAuths.organizationId, organizationId)];
    
    if (startDate) {
      paWhereConditions.push(gte(priorAuths.createdAt, new Date(startDate)));
    }
    
    if (endDate) {
      paWhereConditions.push(lte(priorAuths.createdAt, new Date(endDate)));
    }

    const totalPAsResult = await db
      .select({ count: count() })
      .from(priorAuths)
      .where(and(...paWhereConditions));

    const totalPAs = totalPAsResult[0]?.count || 0;

    // Get automated claims (submitted, accepted, paid) - using actual enum values
    const automatedClaimsResult = await db
      .select({ count: count() })
      .from(claims)
      .where(and(
        ...whereConditions,
        inArray(claims.status, ['submitted', 'accepted', 'paid'])
      ));

    const automatedClaims = automatedClaimsResult[0]?.count || 0;

    // Get automated PAs (approved)
    const automatedPAsResult = await db
      .select({ count: count() })
      .from(priorAuths)
      .where(and(
        ...paWhereConditions,
        eq(priorAuths.status, 'approved')
      ));

    const automatedPAs = automatedPAsResult[0]?.count || 0;

    // Get unique patients count
    const uniquePatientsResult = await db
      .select({ count: countDistinct(claims.patientId) })
      .from(claims)
      .where(and(...whereConditions));

    const patientsServed = uniquePatientsResult[0]?.count || 0;

    // Calculate metrics
    const totalItems = totalClaims + totalPAs;
    const overallAutomationRate = totalItems > 0 ?
      Math.round(((automatedClaims + automatedPAs) / totalItems) * 100) : 0;

    // Estimated processing times (in hours)
    const avgClaimsProcessingHours = 2.5;
    const avgPAsProcessingHours = 1.8;
    const avgProcessingTime = totalItems > 0 ?
      ((avgClaimsProcessingHours * totalClaims) + (avgPAsProcessingHours * totalPAs)) / totalItems : 0;

    const kpiData: CombinedKPIData = {
      totalItems,
      totalClaims,
      totalPAs,
      overallAutomationRate,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      patientsServed
    };

    return Response.json(kpiData);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

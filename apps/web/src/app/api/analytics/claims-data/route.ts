import { NextRequest } from 'next/server';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '@foresight-cdss-next/db';
import { claims, patients, payers } from '@foresight-cdss-next/db/schema';
import { auth } from '@clerk/nextjs/server';

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

    const result = await db
      .select({
        id: claims.id,
        patientId: claims.patientId,
        payerId: claims.payerId,
        status: claims.status,
        totalAmount: claims.totalCharges,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        patient: {
          id: patients.id,
          name: patients.firstName, // Simplified for demo
        },
        payer: {
          id: payers.id,
          name: payers.name,
        }
      })
      .from(claims)
      .leftJoin(patients, eq(claims.patientId, patients.id))
      .leftJoin(payers, eq(claims.payerId, payers.id))
      .where(and(...whereConditions))
      .orderBy(desc(claims.updatedAt));

    const formattedClaims = result.map(claim => ({
      id: claim.id,
      patient: {
        id: claim.patient?.id || 0,
        name: claim.patient?.name || 'Unknown Patient'
      },
      payer: {
        id: claim.payer?.id || 0,
        name: claim.payer?.name || 'Unknown Payer'
      },
      status: claim.status,
      total_amount: claim.totalAmount || 0,
      createdAt: claim.createdAt?.toISOString(),
      updatedAt: claim.updatedAt?.toISOString()
    }));

    return Response.json({ claims: formattedClaims });
  } catch (error) {
    console.error('Error fetching claims data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

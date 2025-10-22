import { NextRequest } from 'next/server';
import { getPharmacyInfo } from '../../_utils/getPharmacyInfo';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';

// Helper function to get clinician for user
async function getClinicianForUser(userId: string, organizationId?: string) {
  const { db } = (await import('@/lib/aws/database')).createDatabaseAdminClient();

  // Verify user has access to organization if provided
  if (organizationId) {
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.organizationId, organizationId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      throw new Error('User does not have access to this organization');
    }
  }

  // Get user's first available clinician with DoseSpot provider ID
  const { data: clinician } = await safeSingle(async () => {
    const whereConditions = [
      isNull(clinicians.deletedAt),
      isNotNull(clinicians.dosespotProviderId)
    ];
    
    // If organizationId is provided, filter by it
    if (organizationId) {
      whereConditions.push(eq(clinicians.organizationId, organizationId));
    }
    
    return db.select({
      dosespotProviderId: clinicians.dosespotProviderId,
      organizationId: clinicians.organizationId,
    })
    .from(clinicians)
    .where(and(...whereConditions));
  });

  if (!clinician?.dosespotProviderId) {
    throw new Error('User does not have access to a clinician with DoseSpot provider ID');
  }

  return {
    dosespotProviderId: clinician.dosespotProviderId,
    organizationId: clinician.organizationId,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dosespotPharmacyId = Number.parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (Number.isNaN(dosespotPharmacyId)) {
      return Response.json(
        { 
          error: 'Invalid parameter',
          message: 'Invalid pharmacy ID' 
        },
        { status: 400 }
      );
    }

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return Response.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Get clinician for user
    const clinician = await getClinicianForUser(userId, organizationId || undefined);

    // Create token
    const { data: token } = await createDosespotToken(clinician.dosespotProviderId);

    if (!token) {
      return Response.json({
        error: 'Token generation failed',
        message: 'Could not generate token to get pharmacy information'
      }, { status: 500 });
    }

    const pharmacy = await getPharmacyInfo(
      dosespotPharmacyId,
      token.access_token
    );

    return Response.json(pharmacy);
  } catch (err) {
    console.error('Error in DoseSpot pharmacy GET [id] endpoint:', err);
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // Handle specific error cases
    if (message.includes('does not have access to this organization')) {
      return Response.json({
        error: 'Access denied',
        message: 'User does not have access to this organization'
      }, { status: 403 });
    }
    
    if (message.includes('User does not have access to a clinician')) {
      return Response.json({
        error: 'No DoseSpot provider found',
        message: 'User does not have access to a clinician with DoseSpot provider ID'
      }, { status: 404 });
    }
    
    return Response.json({
      error: 'Internal server error',
      message
    }, { status: 422 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dosespotPharmacyId = Number.parseInt(params.id);
    const body = await request.json();
    const { organizationId } = body;

    if (Number.isNaN(dosespotPharmacyId)) {
      return Response.json(
        { 
          error: 'Invalid parameter',
          message: 'Invalid pharmacy ID' 
        },
        { status: 400 }
      );
    }

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return Response.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Get clinician for user
    const clinician = await getClinicianForUser(userId, organizationId);

    // Create token
    const { data: token } = await createDosespotToken(clinician.dosespotProviderId);

    if (!token) {
      return Response.json({
        error: 'Token generation failed',
        message: 'Could not generate token to get pharmacy information'
      }, { status: 500 });
    }

    const pharmacy = await getPharmacyInfo(
      dosespotPharmacyId,
      token.access_token
    );

    return Response.json(pharmacy);
  } catch (err) {
    console.error('Error in DoseSpot pharmacy POST [id] endpoint:', err);
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // Handle specific error cases
    if (message.includes('does not have access to this organization')) {
      return Response.json({
        error: 'Access denied',
        message: 'User does not have access to this organization'
      }, { status: 403 });
    }
    
    if (message.includes('User does not have access to a clinician')) {
      return Response.json({
        error: 'No DoseSpot provider found',
        message: 'User does not have access to a clinician with DoseSpot provider ID'
      }, { status: 404 });
    }
    
    return Response.json({
      error: 'Internal server error',
      message
    }, { status: 422 });
  }
}
import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { getDosespotPatientUrl } from '@/app/api/utils/dosespot/getDosespotPatientUrl';
import { getDosespotHeaders } from '@/app/api/utils/dosespot/getDosespotHeaders';

type AddDosespotPharmacyRequestBody = {
  dosespotPatientId: number;
  dosespotPharmacyId: number;
  isPrimary?: boolean;
  organizationId?: string;
};

type AddPharmacyToPatientResult = {
  Result: {
    ResultCode: 'ERROR' | 'OK';
    ResultDescription: string;
  };
};

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AddDosespotPharmacyRequestBody;
    const {
      dosespotPatientId,
      dosespotPharmacyId,
      isPrimary = false,
      organizationId,
    } = body;

    if (!dosespotPharmacyId) {
      return Response.json(
        { 
          error: 'Missing parameter',
          message: 'dosespotPharmacyId is required' 
        },
        { status: 400 }
      );
    }

    if (!dosespotPatientId) {
      return Response.json(
        { 
          error: 'Missing parameter',
          message: 'dosespotPatientId is required' 
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

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${getDosespotPatientUrl()}/${dosespotPatientId}/pharmacies`,
      data: {
        SetAsPrimary: isPrimary,
        PharmacyId: dosespotPharmacyId,
      },
      headers: getDosespotHeaders(token.access_token),
    };

    const { data: pharmacy } = await axios<AddPharmacyToPatientResult>(options);

    if (pharmacy.Result.ResultCode === 'ERROR') {
      throw new Error(
        pharmacy.Result.ResultDescription ||
        `Could not add Pharmacy ${dosespotPharmacyId} to patient ${dosespotPatientId}`
      );
    }

    return Response.json(pharmacy);
  } catch (err) {
    console.error('Error in DoseSpot pharmacy add endpoint:', err);
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
    
    // Handle DoseSpot API errors
    if (message.includes('Could not add Pharmacy')) {
      return Response.json({
        error: 'DoseSpot API error',
        message
      }, { status: 422 });
    }
    
    return Response.json({
      error: 'Internal server error',
      message
    }, { status: 400 });
  }
}
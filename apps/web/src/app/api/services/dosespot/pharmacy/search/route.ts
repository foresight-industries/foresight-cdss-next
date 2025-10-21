import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';
import { safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';

type DosespotPharmacy = {
  PharmacyId: number;
  StoreName: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  PrimaryPhone: string;
  PrimaryPhoneType: number;
  PrimaryFax: string;
  PhoneAdditional1: string | null;
  PhoneAdditionalType1: number;
  PhoneAdditional2: string | null;
  PhoneAdditionalType2: number;
  PhoneAdditional3: string | null;
  PhoneAdditionalType3: number;
  PharmacySpecialties: any[];
  ServiceLevel: number;
  Latitude: number;
  Longitude: number;
};

type DosespotSearchPharmaciesResult = {
  Items: DosespotPharmacy[];
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract all query parameters (exclude organizationId from DoseSpot request)
    const query: Record<string, string> = {};
    const organizationId = searchParams.get('organizationId');
    
    searchParams.forEach((value, key) => {
      if (key !== 'organizationId') {
        query[key] = value;
      }
    });

    console.log({ QUERY: query });

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

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/pharmacies/search?${new URLSearchParams(query)}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    console.log({ OPTIONS: options });

    // Search pharmacies
    const { data: pharmacy } = await axios<DosespotSearchPharmaciesResult>(options);

    console.log({ pharmacy });

    return Response.json(pharmacy.Items);
  } catch (err) {
    const message = getErrorMessage(err);
    console.error('Error in DoseSpot pharmacy search GET endpoint:', err);
    
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams, organizationId, ...restBody } = body;

    // Use searchParams if provided, otherwise use the body directly (exclude organizationId from DoseSpot request)
    const query = searchParams || restBody;
    // Remove organizationId from query if it exists
    delete query.organizationId;

    console.log({ QUERY: query });

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

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/pharmacies/search?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    console.log({ OPTIONS: options });

    // Search pharmacies
    const { data: pharmacy } = await axios<DosespotSearchPharmaciesResult>(options);

    console.log({ pharmacy });

    return Response.json(pharmacy.Items);
  } catch (err) {
    const message = getErrorMessage(err);
    console.error('Error in DoseSpot pharmacy search POST endpoint:', err);
    
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
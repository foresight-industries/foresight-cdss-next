import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { DosespotSupplyResponse } from '@/types/dosespot';

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
    const organizationId = searchParams.get('organizationId');

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

    // Build query parameters for DoseSpot API (exclude organizationId from DoseSpot request)
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'organizationId') {
        queryParams.append(key, value);
      }
    });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/supplies/search?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Search supplies
    const { data: supplies } = await axios<DosespotSupplyResponse>(options);

    if (supplies.Result.ResultCode === 'ERROR') {
      const details = `. Details: { Resource: DosespotSupply}`;
      throw new Error(supplies.Result.ResultDescription + details);
    }

    // Filter out obsolete items
    const activeSupplies = supplies.Items.filter(item => !item.IsObsolete);

    return Response.json(activeSupplies);
  } catch (err) {
    const message = getErrorMessage(err);
    console.log({ ERROR: message });
    
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
    
    return Response.json({ message }, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = body.searchParams || body;
    const organizationId = searchParams.organizationId;

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

    // Build query parameters for DoseSpot API (exclude organizationId from DoseSpot request)
    const queryParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'organizationId') {
        queryParams.append(key, String(value));
      }
    });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/supplies/search?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Search supplies
    const { data: supplies } = await axios<DosespotSupplyResponse>(options);

    if (supplies.Result.ResultCode === 'ERROR') {
      const details = `. Details: { Resource: DosespotSupply}`;
      throw new Error(supplies.Result.ResultDescription + details);
    }

    // Filter out obsolete items
    const activeSupplies = supplies.Items.filter(item => !item.IsObsolete);

    return Response.json(activeSupplies);
  } catch (err) {
    const message = getErrorMessage(err);
    console.log({ ERROR: message });
    
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
    
    return Response.json({ message }, { status: 422 });
  }
}
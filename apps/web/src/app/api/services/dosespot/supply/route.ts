import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';
import { createDosespotToken } from '../_utils/createDosespotToken';
import { safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
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
      // Ensure dosespotProviderId is not null
      eq(clinicians.dosespotProviderId, clinicians.dosespotProviderId)
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
    dosespotProviderId: clinician.dosespotProviderId!,
    organizationId: clinician.organizationId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const pageNumber = searchParams.get('pageNumber') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
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

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber);
    queryParams.append('pageSize', pageSize);

    if (patientId) {
      queryParams.append('patientId', patientId);
    }

    if (status) {
      queryParams.append('status', status);
    }

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/supplies?${queryParams}`;

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'ERROR') {
      throw new Error(
        response.data.Result.ResultDescription ||
        'Failed to retrieve supplies'
      );
    }

    return Response.json(response.data);
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
    const {
      patientId,
      status,
      pageNumber = 1,
      pageSize = 50,
      organizationId
    } = body;

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
    queryParams.append('pageNumber', pageNumber.toString());
    queryParams.append('pageSize', pageSize.toString());

    if (patientId) {
      queryParams.append('patientId', patientId.toString());
    }

    if (status) {
      queryParams.append('status', status);
    }

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/supplies?${queryParams}`;

    const options: AxiosRequestConfig = {
      method: 'GET', // Note: This is still a GET request to DoseSpot API
      url: url,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'ERROR') {
      throw new Error(
        response.data.Result.ResultDescription ||
        'Failed to retrieve supplies'
      );
    }

    return Response.json(response.data);
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
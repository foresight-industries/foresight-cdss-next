import { NextRequest } from 'next/server';
import { createDosespotToken } from '../../../_utils/createDosespotToken';
import { getPatientPharmacies } from '../../../_utils/getPatientPharmacies';
import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dosespotPatientId = Number.parseInt(params.id);

    if (Number.isNaN(dosespotPatientId)) {
      return Response.json(
        { message: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        {
          message: 'not_authenticated',
          description: 'The user does not have an active session or is not authenticated',
          error: new Error('Not Authorized'),
        },
        { status: 401 }
      );
    }

    const { db } = createDatabaseAdminClient();

    // Get the current user's team membership and organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      throw new Error(`Unauthorized - User not found in any organization`);
    }

    // Get clinician record with DoseSpot provider ID
    const { data: clinician } = await safeSingle(async () =>
      db.select({
        dosespotProviderId: clinicians.dosespotProviderId,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.organizationId, membership.organizationId),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!clinician?.dosespotProviderId) {
      throw new Error(`User has no DoseSpot provider ID`);
    }

    // Create token
    const { data: token } = await createDosespotToken(clinician.dosespotProviderId);

    if (!token) {
      throw new Error(`Could not generate token to get patient pharmacies`);
    }

    const pharmacies = await getPatientPharmacies(
      dosespotPatientId,
      token.access_token
    );

    return Response.json(pharmacies);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dosespotPatientId } = body;

    // Use ID from URL params if not provided in body
    const patientId = dosespotPatientId || Number.parseInt(params.id);

    if (isNaN(patientId)) {
      return Response.json(
        { message: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        {
          message: 'not_authenticated',
          description: 'The user does not have an active session or is not authenticated',
          error: new Error('Not Authorized'),
        },
        { status: 401 }
      );
    }

    const { db } = createDatabaseAdminClient();

    // Get the current user's team membership and organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      throw new Error(`Unauthorized - User not found in any organization`);
    }

    // Get clinician record with DoseSpot provider ID
    const { data: clinician } = await safeSingle(async () =>
      db.select({
        dosespotProviderId: clinicians.dosespotProviderId,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.organizationId, membership.organizationId),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!clinician?.dosespotProviderId) {
      throw new Error(`User has no DoseSpot provider ID`);
    }

    // Create token
    const { data: token } = await createDosespotToken(clinician.dosespotProviderId);

    if (!token) {
      throw new Error(`Could not generate token to get patient pharmacies`);
    }

    const pharmacies = await getPatientPharmacies(
      patientId,
      token.access_token
    );

    return Response.json(pharmacies);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

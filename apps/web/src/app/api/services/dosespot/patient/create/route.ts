import { NextRequest } from 'next/server';
import { AxiosError, isAxiosError } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { createDosespotPatient } from '../../_utils/createDosespotPatient';
import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { clinicians, patients, teamMembers, userProfiles } from '@foresight-cdss-next/db';

type CreateDosespotPatientRequestBody = {
  patientId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateDosespotPatientRequestBody;
    const { patientId } = body;

    if (!patientId) {
      throw new Error(`Patient id is required`);
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

    // Get clinician record for this user in the organization
    const { data: clinician } = await safeSingle(async () =>
      db.select({
        dosespotProviderId: clinicians.dosespotProviderId,
        organizationId: clinicians.organizationId,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.organizationId, membership.organizationId),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!clinician?.dosespotProviderId) {
      throw new Error(`Unauthorized - No DoseSpot provider ID found`);
    }

    // Get the patient record
    const { data: patient } = await safeSingle(async () =>
      db.select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId.toString()),
        eq(patients.organizationId, clinician.organizationId),
        isNull(patients.deletedAt)
      ))
    );

    if (!patient) {
      throw new Error(`Could not find patient for patient id: ${patientId}`);
    }

    if (patient.dosespotPatientId) {
      console.log({
        level: 'info',
        message: `Patient ${patientId} already has dosespot id. Returning...`,
      });

      return Response.json({
        id: patient.id,
        dosespotPatientId: patient.dosespotPatientId,
      });
    }

    // Create token
    const { data: token } = await createDosespotToken(clinician.dosespotProviderId);

    const dosespotPatient = await createDosespotPatient(
      patient,
      token.access_token
    );

    return Response.json(dosespotPatient);
  } catch (err) {
    let message = (err as Error).message;
    if (isAxiosError(err)) {
      message = JSON.stringify((err as AxiosError).response?.data);
    }
    console.log({
      ERROR: message,
    });

    return Response.json({ message }, { status: 400 });
  }
}

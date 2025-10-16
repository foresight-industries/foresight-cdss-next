import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { Encounter, encounters, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { publishEncounterUpdate } from '@/lib/utils/encounter-event-publisher';

interface UpdateEncounterRequest {
  organizationId: string;
  patientId?: string;
  providerId?: string;
  encounterType?: string;
  encounterDate?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  clinicalNotes?: string;
  assessment?: string;
  plan?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  procedureCodes?: string[];
}

// GET /api/encounters/[id] - Get encounter details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const encounterId = params.id;

    // Get encounter with access check
    const { data: encounter } = await safeSingle(async () =>
      db.select({
        id: encounters.id,
        organizationId: encounters.organizationId,
        patientId: encounters.patientId,
        providerId: encounters.providerId,
        encounterNumber: encounters.encounterNumber,
        encounterType: encounters.encounterType,
        encounterDate: encounters.encounterDate,
        chiefComplaint: encounters.chiefComplaint,
        presentIllness: encounters.presentIllness,
        clinicalNotes: encounters.clinicalNotes,
        assessment: encounters.assessment,
        plan: encounters.plan,
        primaryDiagnosis: encounters.primaryDiagnosis,
        secondaryDiagnoses: encounters.secondaryDiagnoses,
        procedureCodes: encounters.procedureCodes,
        createdAt: encounters.createdAt,
        updatedAt: encounters.updatedAt,
      })
      .from(encounters)
      .innerJoin(teamMembers, eq(encounters.organizationId, teamMembers.organizationId))
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(encounters.id, encounterId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ encounter });

  } catch (error) {
    console.error('Error fetching encounter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/encounters/[id] - Update encounter
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const encounterId = params.id;
    const updateData: UpdateEncounterRequest = await request.json();

    // Verify user has access to this encounter
    const { data: existingEncounter } : { data: Encounter | null } = await safeSingle(async () =>
      db.select({
        id: encounters.id,
        organizationId: encounters.organizationId,
        chiefComplaint: encounters.chiefComplaint,
        presentIllness: encounters.presentIllness,
        clinicalNotes: encounters.clinicalNotes,
        assessment: encounters.assessment,
        plan: encounters.plan,
        primaryDiagnosis: encounters.primaryDiagnosis,
        secondaryDiagnoses: encounters.secondaryDiagnoses,
        procedureCodes: encounters.procedureCodes,
      })
      .from(encounters)
      .innerJoin(teamMembers, eq(encounters.organizationId, teamMembers.organizationId))
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(encounters.id, encounterId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!existingEncounter) {
      return NextResponse.json({ error: 'Encounter not found or access denied' }, { status: 404 });
    }

    // Track which fields are being changed for Comprehend Medical processing
    const changedFields: string[] = [];

    if (updateData.chiefComplaint !== existingEncounter.chiefComplaint) {
      changedFields.push('chief_complaint');
    }
    if (updateData.presentIllness !== existingEncounter.presentIllness) {
      changedFields.push('present_illness');
    }
    if (updateData.clinicalNotes !== existingEncounter.clinicalNotes) {
      changedFields.push('clinical_notes');
    }
    if (updateData.assessment !== existingEncounter.assessment) {
      changedFields.push('assessment');
    }
    if (updateData.plan !== existingEncounter.plan) {
      changedFields.push('plan');
    }
    if (updateData.primaryDiagnosis !== existingEncounter.primaryDiagnosis) {
      changedFields.push('primary_diagnosis');
    }
    if (JSON.stringify(updateData.secondaryDiagnoses) !== existingEncounter.secondaryDiagnoses) {
      changedFields.push('secondary_diagnoses');
    }
    if (JSON.stringify(updateData.procedureCodes) !== existingEncounter.procedureCodes) {
      changedFields.push('procedure_codes');
    }

    if (changedFields.length === 0) {
      return NextResponse.json({
        message: 'No changes detected',
        encounter: existingEncounter
      });
    }

    // Build update object
    const updateFields: Partial<typeof encounters.$inferInsert> = {};

    if (updateData.chiefComplaint !== undefined) {
      updateFields.chiefComplaint = updateData.chiefComplaint;
    }
    if (updateData.presentIllness !== undefined) {
      updateFields.presentIllness = updateData.presentIllness;
    }
    if (updateData.clinicalNotes !== undefined) {
      updateFields.clinicalNotes = updateData.clinicalNotes;
    }
    if (updateData.assessment !== undefined) {
      updateFields.assessment = updateData.assessment;
    }
    if (updateData.plan !== undefined) {
      updateFields.plan = updateData.plan;
    }
    if (updateData.primaryDiagnosis !== undefined) {
      updateFields.primaryDiagnosis = updateData.primaryDiagnosis;
    }
    if (updateData.secondaryDiagnoses !== undefined) {
      updateFields.secondaryDiagnoses = JSON.stringify(updateData.secondaryDiagnoses);
    }
    if (updateData.procedureCodes !== undefined) {
      updateFields.procedureCodes = JSON.stringify(updateData.procedureCodes);
    }

    // Update the encounter
    const { data: updatedEncounter } = await safeUpdate(async () =>
      db.update(encounters)
        .set({
          ...updateFields,
          updatedAt: new Date(),
        })
        .where(eq(encounters.id, encounterId))
        .returning()
    );

    if (!updatedEncounter || updatedEncounter.length === 0) {
      return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 });
    }

    // Trigger Comprehend Medical processing if clinical_notes was updated and is not empty
    if (changedFields.includes('clinical_notes') && updateData.clinicalNotes?.trim()) {
      try {
        await publishEncounterUpdate({
          encounterId,
          organizationId: existingEncounter.organizationId,
          clinicalNotes: updateData.clinicalNotes,
          changedFields,
          userId,
        });
        console.log(`Triggered Comprehend Medical processing for encounter ${encounterId}`);
      } catch (error) {
        console.error('Error triggering Comprehend Medical processing:', error);
        // Don't fail the main update operation if event publishing fails
      }
    }

    return NextResponse.json({
      message: 'Encounter updated successfully',
      encounter: updatedEncounter[0],
      changedFields,
      comprehendMedicalTriggered: changedFields.includes('clinical_notes') && updateData.clinicalNotes?.trim(),
    });

  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

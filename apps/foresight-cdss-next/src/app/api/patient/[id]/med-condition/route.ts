import { NextRequest, NextResponse } from 'next/server';
import { db } from '@foresight-cdss-next/db';
import { medicalHistory, patients, teamMembers } from '@foresight-cdss-next/db/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { requireTeamMembership } from '@/lib/team';
import { z } from 'zod';

// Schema for validating medical condition input
const medicalConditionSchema = z.object({
  conditionName: z.string().min(1, 'Condition name is required'),
  icd10Code: z.string().optional(),
  snomedCode: z.string().optional(),
  onsetDate: z.string().optional(), // ISO date string
  diagnosisDate: z.string().optional(), // ISO date string
  resolvedDate: z.string().optional(), // ISO date string
  isActive: z.boolean().default(true),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  diagnosedBy: z.string().optional(), // Provider ID
  source: z.enum(['patient_reported', 'clinical_diagnosis', 'lab_result', 'imaging', 'other']).default('clinical_diagnosis'),
  isFamilyHistory: z.boolean().default(false),
  relationToPatient: z.string().optional(), // Required if isFamilyHistory is true
});

// GET - Retrieve all medical conditions for a patient
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { isAuthenticated } = await auth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    const patientId = params.id;

    // Verify patient exists and belongs to organization
    const patient = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.organizationId, organizationId),
        isNull(patients.deletedAt)
      ))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get all medical conditions for the patient
    const conditions = await db
      .select({
        id: medicalHistory.id,
        conditionName: medicalHistory.conditionName,
        icd10Code: medicalHistory.icd10Code,
        snomedCode: medicalHistory.snomedCode,
        onsetDate: medicalHistory.onsetDate,
        diagnosisDate: medicalHistory.diagnosisDate,
        resolvedDate: medicalHistory.resolvedDate,
        isActive: medicalHistory.isActive,
        severity: medicalHistory.severity,
        symptoms: medicalHistory.symptoms,
        treatment: medicalHistory.treatment,
        notes: medicalHistory.notes,
        diagnosedBy: medicalHistory.diagnosedBy,
        source: medicalHistory.source,
        isFamilyHistory: medicalHistory.isFamilyHistory,
        relationToPatient: medicalHistory.relationToPatient,
        createdAt: medicalHistory.createdAt,
        updatedAt: medicalHistory.updatedAt,
      })
      .from(medicalHistory)
      .where(and(
        eq(medicalHistory.patientId, patientId),
        eq(medicalHistory.organizationId, organizationId),
        isNull(medicalHistory.deletedAt)
      ))
      .orderBy(desc(medicalHistory.createdAt));

    return NextResponse.json({
      patientId,
      conditions: conditions.map(condition => ({
        ...condition,
        onsetDate: condition.onsetDate || null,
        diagnosisDate: condition.diagnosisDate || null,
        resolvedDate: condition.resolvedDate || null,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching medical conditions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical conditions' },
      { status: 500 }
    );
  }
}

// POST - Add a new medical condition for a patient
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    // Get the team member ID for audit tracking
    const teamMemberData = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId!),
        eq(teamMembers.organizationId, organizationId)
      ))
      .limit(1);

    const teamMemberId = teamMemberData[0]?.id;

    const patientId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = medicalConditionSchema.parse(body);

    // Verify patient exists and belongs to organization
    const patient = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.organizationId, organizationId),
        isNull(patients.deletedAt)
      ))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Validate family history relation
    if (validatedData.isFamilyHistory && !validatedData.relationToPatient) {
      return NextResponse.json(
        { error: 'Relation to patient is required for family history' },
        { status: 400 }
      );
    }

    // Create the medical condition record
    const newCondition = await db
      .insert(medicalHistory)
      .values({
        organizationId,
        patientId,
        conditionName: validatedData.conditionName,
        icd10Code: validatedData.icd10Code || null,
        snomedCode: validatedData.snomedCode || null,
        onsetDate: validatedData.onsetDate || null,
        diagnosisDate: validatedData.diagnosisDate || null,
        resolvedDate: validatedData.resolvedDate || null,
        isActive: validatedData.isActive,
        severity: validatedData.severity || null,
        symptoms: validatedData.symptoms || null,
        treatment: validatedData.treatment || null,
        notes: validatedData.notes || null,
        diagnosedBy: validatedData.diagnosedBy || null,
        source: validatedData.source,
        isFamilyHistory: validatedData.isFamilyHistory,
        relationToPatient: validatedData.relationToPatient || null,
        createdBy: teamMemberId,
        updatedBy: teamMemberId,
      })
      .returning({
        id: medicalHistory.id,
        conditionName: medicalHistory.conditionName,
        icd10Code: medicalHistory.icd10Code,
        snomedCode: medicalHistory.snomedCode,
        onsetDate: medicalHistory.onsetDate,
        diagnosisDate: medicalHistory.diagnosisDate,
        resolvedDate: medicalHistory.resolvedDate,
        isActive: medicalHistory.isActive,
        severity: medicalHistory.severity,
        symptoms: medicalHistory.symptoms,
        treatment: medicalHistory.treatment,
        notes: medicalHistory.notes,
        diagnosedBy: medicalHistory.diagnosedBy,
        source: medicalHistory.source,
        isFamilyHistory: medicalHistory.isFamilyHistory,
        relationToPatient: medicalHistory.relationToPatient,
        createdAt: medicalHistory.createdAt,
        updatedAt: medicalHistory.updatedAt,
      });

    const condition = newCondition[0];

    return NextResponse.json({
      message: 'Medical condition created successfully',
      condition: {
        ...condition,
        onsetDate: condition.onsetDate || null,
        diagnosisDate: condition.diagnosisDate || null,
        resolvedDate: condition.resolvedDate || null,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error creating medical condition:', error);
    return NextResponse.json(
      { error: 'Failed to create medical condition' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing medical condition
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    // Get the team member ID for audit tracking
    const teamMemberData = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId!),
        eq(teamMembers.organizationId, organizationId)
      ))
      .limit(1);

    const teamMemberId = teamMemberData[0]?.id;

    const patientId = params.id;

    // Parse request body
    const body = await request.json();
    const { conditionId, ...updateData } = body;

    if (!conditionId) {
      return NextResponse.json({ error: 'Condition ID is required' }, { status: 400 });
    }

    // Validate update data
    const validatedData = medicalConditionSchema.partial().parse(updateData);

    // Verify the condition exists and belongs to the patient/organization
    const existingCondition = await db
      .select()
      .from(medicalHistory)
      .where(and(
        eq(medicalHistory.id, conditionId),
        eq(medicalHistory.patientId, patientId),
        eq(medicalHistory.organizationId, organizationId),
        isNull(medicalHistory.deletedAt)
      ))
      .limit(1);

    if (existingCondition.length === 0) {
      return NextResponse.json({ error: 'Medical condition not found' }, { status: 404 });
    }

    // Update the condition
    const updatedCondition = await db
      .update(medicalHistory)
      .set({
        ...validatedData,
        onsetDate: validatedData.onsetDate || undefined,
        diagnosisDate: validatedData.diagnosisDate || undefined,
        resolvedDate: validatedData.resolvedDate || undefined,
        updatedBy: teamMemberId,
        updatedAt: new Date(),
      })
      .where(eq(medicalHistory.id, conditionId))
      .returning({
        id: medicalHistory.id,
        conditionName: medicalHistory.conditionName,
        icd10Code: medicalHistory.icd10Code,
        snomedCode: medicalHistory.snomedCode,
        onsetDate: medicalHistory.onsetDate,
        diagnosisDate: medicalHistory.diagnosisDate,
        resolvedDate: medicalHistory.resolvedDate,
        isActive: medicalHistory.isActive,
        severity: medicalHistory.severity,
        symptoms: medicalHistory.symptoms,
        treatment: medicalHistory.treatment,
        notes: medicalHistory.notes,
        diagnosedBy: medicalHistory.diagnosedBy,
        source: medicalHistory.source,
        isFamilyHistory: medicalHistory.isFamilyHistory,
        relationToPatient: medicalHistory.relationToPatient,
        createdAt: medicalHistory.createdAt,
        updatedAt: medicalHistory.updatedAt,
      });

    const condition = updatedCondition[0];

    return NextResponse.json({
      message: 'Medical condition updated successfully',
      condition: {
        ...condition,
        onsetDate: condition.onsetDate || null,
        diagnosisDate: condition.diagnosisDate || null,
        resolvedDate: condition.resolvedDate || null,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error updating medical condition:', error);
    return NextResponse.json(
      { error: 'Failed to update medical condition' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a medical condition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { isAuthenticated } = await auth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    const patientId = params.id;
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');

    if (!conditionId) {
      return NextResponse.json({ error: 'Condition ID is required' }, { status: 400 });
    }

    // Verify the condition exists and belongs to the patient/organization
    const existingCondition = await db
      .select()
      .from(medicalHistory)
      .where(and(
        eq(medicalHistory.id, conditionId),
        eq(medicalHistory.patientId, patientId),
        eq(medicalHistory.organizationId, organizationId),
        isNull(medicalHistory.deletedAt)
      ))
      .limit(1);

    if (existingCondition.length === 0) {
      return NextResponse.json({ error: 'Medical condition not found' }, { status: 404 });
    }

    // Soft delete the condition
    await db
      .update(medicalHistory)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(medicalHistory.id, conditionId));

    return NextResponse.json({
      message: 'Medical condition deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medical condition:', error);
    return NextResponse.json(
      { error: 'Failed to delete medical condition' },
      { status: 500 }
    );
  }
}

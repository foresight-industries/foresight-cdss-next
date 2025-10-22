import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeSelect, createDatabaseAdminClient } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { encounters, teamMembers, userProfiles, organizations, visitTypeEnum, Encounter } from '@foresight-cdss-next/db';
import { publishEncounterUpdate } from '@/lib/utils/encounter-event-publisher';

type EncounterType = typeof visitTypeEnum.enumValues[number];

interface CreateEncounterRequest {
  organizationId: string;
  patientId: string;
  providerId?: string;
  encounterType: EncounterType;
  encounterDate: string;
  chiefComplaint?: string;
  presentIllness?: string;
  clinicalNotes?: string;
  assessment?: string;
  plan?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  procedureCodes?: string[];
}

// POST /api/encounters - Create a new encounter
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = createDatabaseAdminClient();
    const createData: CreateEncounterRequest = await request.json();

    // Validate required fields
    if (!createData.organizationId || !createData.patientId || !createData.encounterType || !createData.encounterDate) {
      return NextResponse.json({
        error: 'Missing required fields: organizationId, patientId, encounterType, and encounterDate are required'
      }, { status: 400 });
    }

    // Validate encounter type
    if (!visitTypeEnum.enumValues.includes(createData.encounterType)) {
      return NextResponse.json({
        error: `Invalid encounter type. Must be one of: ${visitTypeEnum.enumValues.join(', ')}`
      }, { status: 400 });
    }

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        organizationSlug: organizations.slug
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(and(
        eq(teamMembers.organizationId, createData.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to create encounters for this organization'
      }, { status: 403 });
    }

    // Generate encounter number (you may want to implement a more sophisticated numbering system)
    const encounterNumber = `ENC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create the encounter
    const { data: newEncounter } = await safeInsert(async () =>
      db.insert(encounters)
        .values({
          organizationId: createData.organizationId,
          patientId: createData.patientId,
          providerId: createData.providerId || userId, // Default to current user if no provider specified
          encounterNumber,
          encounterType: createData.encounterType,
          encounterDate: new Date(createData.encounterDate),
          chiefComplaint: createData.chiefComplaint || null,
          presentIllness: createData.presentIllness || null,
          clinicalNotes: createData.clinicalNotes || null,
          assessment: createData.assessment || null,
          plan: createData.plan || null,
          primaryDiagnosis: createData.primaryDiagnosis || null,
          secondaryDiagnoses: createData.secondaryDiagnoses ? JSON.stringify(createData.secondaryDiagnoses) : null,
          procedureCodes: createData.procedureCodes ? JSON.stringify(createData.procedureCodes) : null,
        })
        .returning()
    );

    if (!newEncounter || newEncounter.length === 0) {
      return NextResponse.json({ error: 'Failed to create encounter' }, { status: 500 });
    }

    const createdEncounter = newEncounter[0] as Encounter;

    // Trigger Comprehend Medical processing if clinical notes were provided
    if (createData.clinicalNotes?.trim()) {
      try {
        await publishEncounterUpdate({
          encounterId: createdEncounter.id,
          organizationId: createData.organizationId,
          clinicalNotes: createData.clinicalNotes,
          changedFields: ['clinical_notes'],
          userId,
        });
        console.log(`Triggered Comprehend Medical processing for new encounter ${createdEncounter.id}`);
      } catch (error) {
        console.error('Error triggering Comprehend Medical processing:', error);
        // Don't fail the creation operation if event publishing fails
      }
    }

    return NextResponse.json({
      message: 'Encounter created successfully',
      encounter: {
        ...createdEncounter,
        secondaryDiagnoses: createdEncounter.secondaryDiagnoses
          ? JSON.parse(createdEncounter.secondaryDiagnoses)
          : [],
        procedureCodes: createdEncounter.procedureCodes
          ? JSON.parse(createdEncounter.procedureCodes)
          : [],
      },
      comprehendMedicalTriggered: !!createData.clinicalNotes?.trim(),
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/encounters - List encounters (with pagination and filtering)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const patientId = searchParams.get('patientId');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({
        error: 'organizationId query parameter is required'
      }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view encounters for this organization'
      }, { status: 403 });
    }

    // Build where conditions
    const whereConditions = [
      eq(encounters.organizationId, organizationId)
    ];

    if (patientId) {
      whereConditions.push(eq(encounters.patientId, patientId));
    }

    // Get encounters with pagination
    const { data: encounterList } = await safeSelect(async () =>
      db.select({
        id: encounters.id,
        organizationId: encounters.organizationId,
        patientId: encounters.patientId,
        providerId: encounters.providerId,
        encounterNumber: encounters.encounterNumber,
        encounterType: encounters.encounterType,
        encounterDate: encounters.encounterDate,
        chiefComplaint: encounters.chiefComplaint,
        primaryDiagnosis: encounters.primaryDiagnosis,
        createdAt: encounters.createdAt,
        updatedAt: encounters.updatedAt,
      })
      .from(encounters)
      .where(and(...whereConditions))
      .orderBy(encounters.encounterDate)
      .limit(limit)
      .offset(offset)
    );

    return NextResponse.json({
      encounters: encounterList || [],
      pagination: {
        limit,
        offset,
        hasMore: (encounterList?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

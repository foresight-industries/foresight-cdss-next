import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { priorAuths, teamMembers, userProfiles, patients, providers, payers } from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schema for creating a prior authorization
const createPriorAuthSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),

  // Required references
  patientId: z.uuid('Invalid patient ID'),
  providerId: z.uuid('Invalid provider ID'),
  payerId: z.uuid('Invalid payer ID'),

  // Identifiers
  authNumber: z.string().max(50).optional(),
  referenceNumber: z.string().max(50).optional(),
  dosespotCaseId: z.number().optional(),

  // Request details
  requestedService: z.string().min(1, 'Requested service is required'),
  cptCodes: z.string().optional(), // JSON array of CPT codes
  diagnosisCodes: z.string().optional(), // JSON array of diagnosis codes

  // Dates
  requestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),

  // Clinical information
  clinicalNotes: z.string().optional(),
  medicalNecessity: z.string().optional(),

  // Processing details
  submissionMethod: z.enum(['portal', 'phone', 'fax', 'mail']).optional(),
  approvedUnits: z.number().positive().optional(),

  // External system identifiers
  externalId: z.string().max(100).optional(),
  externalSystem: z.string().max(50).optional(),
});

// POST /api/prior-auth/init - Initialize a new prior authorization request
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawData = await request.json();

    // Validate request data
    const validation = createPriorAuthSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const priorAuthData = validation.data;
    const { db } = await createAuthenticatedDatabaseClient();

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, priorAuthData.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to create prior authorizations for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions (providers, admins, and owners can create PAs)
    if (!['provider', 'admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only providers, admins, and owners can create prior authorization requests'
      }, { status: 403 });
    }

    // Verify that the patient exists and belongs to the organization
    const { data: patient } = await safeSingle(async () =>
      db.select({
        id: patients.id,
        organizationId: patients.organizationId,
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(patients)
      .where(and(
        eq(patients.id, priorAuthData.patientId),
        eq(patients.organizationId, priorAuthData.organizationId),
        isNull(patients.deletedAt)
      ))
    );

    if (!patient) {
      return NextResponse.json({
        error: 'Patient not found or does not belong to this organization'
      }, { status: 404 });
    }

    // Verify that the provider exists and belongs to the organization
    const { data: provider } = await safeSingle(async () =>
      db.select({
        id: providers.id,
        organizationId: providers.organizationId,
        firstName: providers.firstName,
        lastName: providers.lastName,
      })
      .from(providers)
      .where(and(
        eq(providers.id, priorAuthData.providerId),
        eq(providers.organizationId, priorAuthData.organizationId),
        isNull(providers.deletedAt)
      ))
    );

    if (!provider) {
      return NextResponse.json({
        error: 'Provider not found or does not belong to this organization'
      }, { status: 404 });
    }

    // Verify that the payer exists
    const { data: payer } = await safeSingle(async () =>
      db.select({
        id: payers.id,
        name: payers.name,
      })
      .from(payers)
      .where(and(
        eq(payers.id, priorAuthData.payerId),
        isNull(payers.deletedAt)
      ))
    );

    if (!payer) {
      return NextResponse.json({
        error: 'Payer not found'
      }, { status: 404 });
    }

    // Generate reference number if not provided
    const referenceNumber = priorAuthData.referenceNumber || `PA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create the prior authorization record
    const { data: newPriorAuth } = await safeInsert(async () =>
      db.insert(priorAuths)
        .values({
          organizationId: priorAuthData.organizationId,
          patientId: priorAuthData.patientId,
          providerId: priorAuthData.providerId,
          payerId: priorAuthData.payerId,
          authNumber: priorAuthData.authNumber || null,
          referenceNumber: referenceNumber,
          dosespotCaseId: priorAuthData.dosespotCaseId || null,
          requestedService: priorAuthData.requestedService,
          cptCodes: priorAuthData.cptCodes || null,
          diagnosisCodes: priorAuthData.diagnosisCodes || null,
          requestDate: priorAuthData.requestDate,
          effectiveDate: priorAuthData.effectiveDate || null,
          expirationDate: priorAuthData.expirationDate || null,
          status: 'pending',
          clinicalNotes: priorAuthData.clinicalNotes || null,
          medicalNecessity: priorAuthData.medicalNecessity || null,
          submissionMethod: priorAuthData.submissionMethod || null,
          approvedUnits: priorAuthData.approvedUnits || null,
          createdBy: membershipData.teamMemberId,
        })
        .returning()
    );

    if (!newPriorAuth || newPriorAuth.length === 0) {
      return NextResponse.json({ error: 'Failed to create prior authorization record' }, { status: 500 });
    }

    const createdPriorAuth = newPriorAuth[0] as any;

    // Format response with additional context
    const responseData = {
      id: createdPriorAuth.id,
      organizationId: createdPriorAuth.organizationId,
      patientId: createdPriorAuth.patientId,
      providerId: createdPriorAuth.providerId,
      payerId: createdPriorAuth.payerId,
      authNumber: createdPriorAuth.authNumber,
      referenceNumber: createdPriorAuth.referenceNumber,
      dosespotCaseId: createdPriorAuth.dosespotCaseId,
      requestedService: createdPriorAuth.requestedService,
      cptCodes: createdPriorAuth.cptCodes,
      diagnosisCodes: createdPriorAuth.diagnosisCodes,
      requestDate: createdPriorAuth.requestDate,
      effectiveDate: createdPriorAuth.effectiveDate,
      expirationDate: createdPriorAuth.expirationDate,
      status: createdPriorAuth.status,
      clinicalNotes: createdPriorAuth.clinicalNotes,
      medicalNecessity: createdPriorAuth.medicalNecessity,
      submissionMethod: createdPriorAuth.submissionMethod,
      approvedUnits: createdPriorAuth.approvedUnits,
      createdAt: createdPriorAuth.createdAt,
      updatedAt: createdPriorAuth.updatedAt,
      // Include related entity information
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      provider: {
        id: provider.id,
        firstName: provider.firstName,
        lastName: provider.lastName,
      },
      payer: {
        id: payer.id,
        name: payer.name,
      },
      // Include external system metadata if provided
      external: priorAuthData.externalId ? {
        externalId: priorAuthData.externalId,
        externalSystem: priorAuthData.externalSystem,
      } : null,
    };

    return NextResponse.json({
      message: 'Prior authorization initialized successfully',
      priorAuth: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating prior authorization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/prior-auth/init - Get template/schema for creating a prior authorization
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

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
        error: 'Access denied: You do not have permission to access this organization'
      }, { status: 403 });
    }

    // Return schema and available options
    return NextResponse.json({
      schema: {
        required: ['organizationId', 'patientId', 'providerId', 'payerId', 'requestedService', 'requestDate'],
        optional: ['authNumber', 'referenceNumber', 'dosespotCaseId', 'cptCodes', 'diagnosisCodes',
                  'effectiveDate', 'expirationDate', 'clinicalNotes', 'medicalNecessity',
                  'submissionMethod', 'approvedUnits', 'externalId', 'externalSystem'],
        fields: {
          organizationId: { type: 'uuid', description: 'Organization UUID' },
          patientId: { type: 'uuid', description: 'Patient UUID' },
          providerId: { type: 'uuid', description: 'Provider UUID' },
          payerId: { type: 'uuid', description: 'Payer UUID' },
          authNumber: { type: 'string', maxLength: 50, description: 'Authorization number from payer' },
          referenceNumber: { type: 'string', maxLength: 50, description: 'Internal reference number' },
          dosespotCaseId: { type: 'number', description: 'DoseSpot case ID for medication PAs' },
          requestedService: { type: 'string', description: 'Description of requested service/medication' },
          cptCodes: { type: 'string', description: 'JSON array of CPT codes' },
          diagnosisCodes: { type: 'string', description: 'JSON array of diagnosis codes' },
          requestDate: { type: 'date', format: 'YYYY-MM-DD', description: 'Date of PA request' },
          effectiveDate: { type: 'date', format: 'YYYY-MM-DD', description: 'Date PA becomes effective' },
          expirationDate: { type: 'date', format: 'YYYY-MM-DD', description: 'Date PA expires' },
          clinicalNotes: { type: 'text', description: 'Clinical notes supporting the request' },
          medicalNecessity: { type: 'text', description: 'Medical necessity justification' },
          submissionMethod: { type: 'enum', values: ['portal', 'phone', 'fax', 'mail'] },
          approvedUnits: { type: 'number', description: 'Number of approved units/doses' },
          externalId: { type: 'string', maxLength: 100, description: 'External system identifier' },
          externalSystem: { type: 'string', maxLength: 50, description: 'Name of external system' },
        }
      },
      organizationId: organizationId
    });

  } catch (error) {
    console.error('Error fetching prior auth schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

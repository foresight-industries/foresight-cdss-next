import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { patients, teamMembers, userProfiles, addresses } from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schemas
const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters').max(10),
  isPrimary: z.boolean().default(true),
});

const createPatientSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),

  // Required demographics
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),

  // Optional demographics
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),

  // Identifiers
  mrn: z.string().max(50).optional(),
  ssnLast4: z.string().length(4, 'SSN last 4 must be exactly 4 digits').regex(/^\d{4}$/, 'SSN last 4 must be digits only').optional(),

  // Contact information
  email: z.email('Invalid email format').optional(),
  phoneHome: z.string().max(20).optional(),
  phoneMobile: z.string().max(20).optional(),
  phoneWork: z.string().max(20).optional(),

  // Address (optional)
  address: addressSchema.optional(),
});

// POST /api/patient - Create a new patient record
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const rawData = await request.json();

    // Validate request data
    const validation = createPatientSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const patientData = validation.data;

    // Verify user has access to the organization and get team member ID
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, patientData.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to create patients for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions (providers and admins can create patients)
    if (!['provider', 'admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only providers, admins, and owners can create patient records'
      }, { status: 403 });
    }

    // Check if MRN is unique within the organization (if provided)
    if (patientData.mrn) {
      const mrnValue = patientData.mrn; // Type guard ensures this is string
      const { data: existingPatient } = await safeSingle(async () =>
        db.select({ id: patients.id })
        .from(patients)
        .where(and(
          eq(patients.organizationId, patientData.organizationId),
          eq(patients.mrn, mrnValue),
          isNull(patients.deletedAt)
        ))
      );

      if (existingPatient) {
        return NextResponse.json({
          error: 'A patient with this MRN already exists in your organization'
        }, { status: 409 });
      }
    }

    // Create the patient record
    const { data: newPatient } = await safeInsert(async () =>
      db.insert(patients)
        .values({
          organizationId: patientData.organizationId,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          middleName: patientData.middleName || null,
          dateOfBirth: patientData.dateOfBirth || null,
          gender: patientData.gender || null,
          mrn: patientData.mrn || null,
          ssnLast4: patientData.ssnLast4 || null,
          email: patientData.email || null,
          phoneHome: patientData.phoneHome || null,
          phoneMobile: patientData.phoneMobile || null,
          phoneWork: patientData.phoneWork || null,
          isActive: true,
          createdBy: membershipData.teamMemberId,
        })
        .returning()
    );

    if (!newPatient || newPatient.length === 0) {
      return NextResponse.json({ error: 'Failed to create patient record' }, { status: 500 });
    }

    const createdPatient = newPatient[0] as any;

    // Create address record if provided
    let addressResult: any = null;
    if (patientData.address) {
      const { data: newAddress } = await safeInsert(async () =>
        db.insert(addresses)
          .values({
            patientId: createdPatient.id,
            addressLine1: patientData.address!.addressLine1,
            addressLine2: patientData.address!.addressLine2 || null,
            city: patientData.address!.city,
            state: patientData.address!.state,
            zipCode: patientData.address!.zipCode,
            isPrimary: patientData.address!.isPrimary ?? true,
          })
          .returning()
      );

      if (newAddress && newAddress.length > 0) {
        addressResult = newAddress[0] as any;
      }
    }

    // Format response
    const responseData = {
      id: createdPatient.id,
      organizationId: createdPatient.organizationId,
      firstName: createdPatient.firstName,
      lastName: createdPatient.lastName,
      middleName: createdPatient.middleName,
      dateOfBirth: createdPatient.dateOfBirth,
      gender: createdPatient.gender,
      mrn: createdPatient.mrn,
      ssnLast4: createdPatient.ssnLast4,
      email: createdPatient.email,
      phoneHome: createdPatient.phoneHome,
      phoneMobile: createdPatient.phoneMobile,
      phoneWork: createdPatient.phoneWork,
      isActive: createdPatient.isActive,
      createdAt: createdPatient.createdAt,
      updatedAt: createdPatient.updatedAt,
      address: addressResult ? {
        id: addressResult.id,
        addressLine1: addressResult.addressLine1,
        addressLine2: addressResult.addressLine2,
        city: addressResult.city,
        state: addressResult.state,
        zipCode: addressResult.zipCode,
        isPrimary: addressResult.isPrimary,
      } : null,
    };

    return NextResponse.json({
      message: 'Patient created successfully',
      patient: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/patient - List patients for an organization
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search'); // Search by name, MRN, or email
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100); // Max 100 patients per request
    const offset = Number(searchParams.get('offset')) || 0;

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
        error: 'Access denied: You do not have permission to view patients for this organization'
      }, { status: 403 });
    }

    // Get patients for the organization
    const { data: patientsList } = await safeSelect(async () =>
      db.select({
        id: patients.id,
        organizationId: patients.organizationId,
        firstName: patients.firstName,
        lastName: patients.lastName,
        middleName: patients.middleName,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        mrn: patients.mrn,
        ssnLast4: patients.ssnLast4,
        email: patients.email,
        phoneHome: patients.phoneHome,
        phoneMobile: patients.phoneMobile,
        phoneWork: patients.phoneWork,
        isActive: patients.isActive,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt,
      })
      .from(patients)
      .where(and(
        eq(patients.organizationId, organizationId),
        isNull(patients.deletedAt)
      ))
      .orderBy(patients.lastName, patients.firstName)
      .limit(limit)
      .offset(offset)
    );

    // Apply client-side search filtering if search term provided
    // Note: This is not efficient for large datasets and should be replaced with proper DB search
    let filteredPatients = patientsList || [];
    if (search?.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredPatients = filteredPatients.filter(patient =>
        patient.firstName.toLowerCase().includes(searchTerm) ||
        patient.lastName.toLowerCase().includes(searchTerm) ||
        patient.mrn?.toLowerCase().includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json({
      patients: filteredPatients,
      pagination: {
        limit,
        offset,
        total: filteredPatients.length,
        hasMore: filteredPatients.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

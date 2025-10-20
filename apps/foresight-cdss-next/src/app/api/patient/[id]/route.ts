import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate, safeSelect, safeInsert } from '@/lib/aws/database';
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

const updatePatientSchema = z.object({
  // Optional demographics
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
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
  
  // Status
  isActive: z.boolean().optional(),
  
  // Address (optional)
  address: addressSchema.optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/patient/[id] - Get a specific patient by ID
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const patientId = params.id;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Get the patient record
    const { data: patient } = await safeSingle(async () =>
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
        eq(patients.id, patientId),
        isNull(patients.deletedAt)
      ))
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, patient.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view this patient'
      }, { status: 403 });
    }

    // Get patient's addresses
    const { data: patientAddresses } = await safeSelect(async () =>
      db.select({
        id: addresses.id,
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        city: addresses.city,
        state: addresses.state,
        zipCode: addresses.zipCode,
        isPrimary: addresses.isPrimary,
      })
      .from(addresses)
      .where(eq(addresses.patientId, patientId))
      .orderBy(addresses.isPrimary)
    );

    // Format response
    const responseData = {
      ...patient,
      addresses: patientAddresses || [],
    };

    return NextResponse.json({
      patient: responseData
    });

  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/patient/[id] - Update a specific patient
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const patientId = params.id;
    const rawData = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Validate request data
    const validation = updatePatientSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const updateData = validation.data;

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'At least one field must be provided for update'
      }, { status: 400 });
    }

    // Get the existing patient record
    const { data: existingPatient } = await safeSingle(async () =>
      db.select({
        id: patients.id,
        organizationId: patients.organizationId,
        firstName: patients.firstName,
        lastName: patients.lastName,
        mrn: patients.mrn,
      })
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        isNull(patients.deletedAt)
      ))
    );

    if (!existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

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
        eq(teamMembers.organizationId, existingPatient.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to update this patient'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions
    if (!['provider', 'admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only providers, admins, and owners can update patient records'
      }, { status: 403 });
    }

    // Check if MRN is unique within the organization (if being updated)
    if (updateData.mrn && updateData.mrn !== existingPatient.mrn) {
      const mrnValue = updateData.mrn;
      const { data: mrnConflict } = await safeSingle(async () =>
        db.select({ id: patients.id })
        .from(patients)
        .where(and(
          eq(patients.organizationId, existingPatient.organizationId),
          eq(patients.mrn, mrnValue),
          isNull(patients.deletedAt)
        ))
      );

      if (mrnConflict) {
        return NextResponse.json({
          error: 'A patient with this MRN already exists in your organization'
        }, { status: 409 });
      }
    }

    // Prepare update values
    const updateValues: any = {
      updatedBy: membershipData.teamMemberId,
      updatedAt: new Date(),
    };

    if (updateData.firstName !== undefined) updateValues.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updateValues.lastName = updateData.lastName;
    if (updateData.middleName !== undefined) updateValues.middleName = updateData.middleName;
    if (updateData.dateOfBirth !== undefined) updateValues.dateOfBirth = updateData.dateOfBirth;
    if (updateData.gender !== undefined) updateValues.gender = updateData.gender;
    if (updateData.mrn !== undefined) updateValues.mrn = updateData.mrn;
    if (updateData.ssnLast4 !== undefined) updateValues.ssnLast4 = updateData.ssnLast4;
    if (updateData.email !== undefined) updateValues.email = updateData.email;
    if (updateData.phoneHome !== undefined) updateValues.phoneHome = updateData.phoneHome;
    if (updateData.phoneMobile !== undefined) updateValues.phoneMobile = updateData.phoneMobile;
    if (updateData.phoneWork !== undefined) updateValues.phoneWork = updateData.phoneWork;
    if (updateData.isActive !== undefined) updateValues.isActive = updateData.isActive;

    // Update the patient record
    const { data: updatedPatient } = await safeUpdate(async () =>
      db.update(patients)
        .set(updateValues)
        .where(eq(patients.id, patientId))
        .returning()
    );

    if (!updatedPatient || updatedPatient.length === 0) {
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
    }

    const updatedRecord = updatedPatient[0] as any;

    // Handle address update if provided
    // Note: This is a simplified approach - in production you might want more sophisticated address management
    if (updateData.address) {
      // For simplicity, we'll update the primary address or create one if none exists
      const { data: existingAddress } = await safeSingle(async () =>
        db.select({ id: addresses.id })
        .from(addresses)
        .where(and(
          eq(addresses.patientId, patientId),
          eq(addresses.isPrimary, true)
        ))
      );

      if (existingAddress) {
        // Update existing primary address
        await safeUpdate(async () =>
          db.update(addresses)
            .set({
              addressLine1: updateData.address!.addressLine1,
              addressLine2: updateData.address!.addressLine2 || null,
              city: updateData.address!.city,
              state: updateData.address!.state,
              zipCode: updateData.address!.zipCode,
              isPrimary: updateData.address!.isPrimary ?? true,
            })
            .where(eq(addresses.id, existingAddress.id))
            .returning()
        );
      } else {
        // Create new primary address
        await safeInsert(async () =>
          db.insert(addresses).values({
            patientId: patientId,
            addressLine1: updateData.address!.addressLine1,
            addressLine2: updateData.address!.addressLine2 || null,
            city: updateData.address!.city,
            state: updateData.address!.state,
            zipCode: updateData.address!.zipCode,
            isPrimary: updateData.address!.isPrimary ?? true,
          })
        );
      }
    }

    // Format response
    const responseData = {
      id: updatedRecord.id,
      organizationId: updatedRecord.organizationId,
      firstName: updatedRecord.firstName,
      lastName: updatedRecord.lastName,
      middleName: updatedRecord.middleName,
      dateOfBirth: updatedRecord.dateOfBirth,
      gender: updatedRecord.gender,
      mrn: updatedRecord.mrn,
      ssnLast4: updatedRecord.ssnLast4,
      email: updatedRecord.email,
      phoneHome: updatedRecord.phoneHome,
      phoneMobile: updatedRecord.phoneMobile,
      phoneWork: updatedRecord.phoneWork,
      isActive: updatedRecord.isActive,
      createdAt: updatedRecord.createdAt,
      updatedAt: updatedRecord.updatedAt,
    };

    return NextResponse.json({
      message: 'Patient updated successfully',
      patient: responseData
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/patient/[id] - Soft delete a patient
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const patientId = params.id;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Get the existing patient record
    const { data: existingPatient } = await safeSingle(async () =>
      db.select({
        id: patients.id,
        organizationId: patients.organizationId,
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        isNull(patients.deletedAt)
      ))
    );

    if (!existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

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
        eq(teamMembers.organizationId, existingPatient.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to delete this patient'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can delete patient records'
      }, { status: 403 });
    }

    // Soft delete the patient record
    await safeUpdate(async () =>
      db.update(patients)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedBy: membershipData.teamMemberId,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, patientId))
        .returning()
    );

    return NextResponse.json({
      message: 'Patient deleted successfully',
      patient: {
        id: existingPatient.id,
        firstName: existingPatient.firstName,
        lastName: existingPatient.lastName,
      }
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
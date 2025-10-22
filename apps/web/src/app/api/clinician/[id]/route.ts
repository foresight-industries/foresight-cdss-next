import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schema for updating a clinician
const updateClinicianSchema = z.object({
  // Optional fields for update
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),

  // Optional demographics
  middleName: z.string().max(100).optional(),
  suffix: z.string().max(10).optional(),

  // Identifiers
  employeeId: z.string().max(50).optional(),
  npi: z.string().length(10, 'NPI must be exactly 10 digits').regex(/^\d{10}$/, 'NPI must be digits only').optional(),
  licenseNumber: z.string().max(50).optional(),

  // Professional information
  title: z.string().max(50).optional(),
  department: z.string().max(50).optional(),
  specialty: z.string().optional(),
  credentials: z.string().optional(),

  // Contact information
  email: z.email('Invalid email format').optional(),
  phone: z.string().max(20).optional(),

  // Employment
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  employmentStatus: z.enum(['active', 'inactive', 'terminated']).optional(),

  // Access permissions
  canAccessPhi: z.boolean().optional(),
  accessLevel: z.enum(['none', 'read', 'write', 'admin', 'owner']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/clinician/[id] - Get a specific clinician record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Clinician ID is required' }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get the clinician record and verify access
    const { data: clinician } = await safeSingle(async () =>
      db.select({
        id: clinicians.id,
        organizationId: clinicians.organizationId,
        firstName: clinicians.firstName,
        lastName: clinicians.lastName,
        middleName: clinicians.middleName,
        suffix: clinicians.suffix,
        employeeId: clinicians.employeeId,
        npi: clinicians.npi,
        licenseNumber: clinicians.licenseNumber,
        title: clinicians.title,
        department: clinicians.department,
        specialty: clinicians.specialty,
        credentials: clinicians.credentials,
        email: clinicians.email,
        phone: clinicians.phone,
        hireDate: clinicians.hireDate,
        employmentStatus: clinicians.employmentStatus,
        canAccessPhi: clinicians.canAccessPhi,
        accessLevel: clinicians.accessLevel,
        isActive: clinicians.isActive,
        createdAt: clinicians.createdAt,
        updatedAt: clinicians.updatedAt,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.id, id),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!clinician) {
      return NextResponse.json({ error: 'Clinician not found' }, { status: 404 });
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
        eq(teamMembers.organizationId, clinician.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view this clinician'
      }, { status: 403 });
    }

    return NextResponse.json({ clinician });

  } catch (error) {
    console.error('Error fetching clinician:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/clinician/[id] - Update a specific clinician record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const rawData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Clinician ID is required' }, { status: 400 });
    }

    // Validate request data
    const validation = updateClinicianSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const updateData = validation.data;
    const { db } = await createAuthenticatedDatabaseClient();

    // Get the current clinician record to verify access and get organization
    const { data: existingClinician } = await safeSingle(async () =>
      db.select({
        id: clinicians.id,
        organizationId: clinicians.organizationId,
        npi: clinicians.npi,
        employeeId: clinicians.employeeId,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.id, id),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!existingClinician) {
      return NextResponse.json({ error: 'Clinician not found' }, { status: 404 });
    }

    // Verify user has access to the organization and get team member info
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, existingClinician.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to update this clinician'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions (only admins and owners can update clinicians)
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can update clinician records'
      }, { status: 403 });
    }

    // Check if NPI is unique within the organization (if being updated)
    if (updateData.npi && updateData.npi !== existingClinician.npi) {
      const npiValue = updateData.npi;
      const { data: duplicateNpiClinician } = await safeSingle(async () =>
        db.select({ id: clinicians.id })
        .from(clinicians)
        .where(and(
          eq(clinicians.organizationId, existingClinician.organizationId),
          eq(clinicians.npi, npiValue),
          isNull(clinicians.deletedAt)
        ))
      );

      if (duplicateNpiClinician) {
        return NextResponse.json({
          error: 'A clinician with this NPI already exists in your organization'
        }, { status: 409 });
      }
    }

    // Check if employee ID is unique within the organization (if being updated)
    if (updateData.employeeId && updateData.employeeId !== existingClinician.employeeId) {
      const employeeIdValue = updateData.employeeId;
      const { data: duplicateEmployeeIdClinician } = await safeSingle(async () =>
        db.select({ id: clinicians.id })
        .from(clinicians)
        .where(and(
          eq(clinicians.organizationId, existingClinician.organizationId),
          eq(clinicians.employeeId, employeeIdValue),
          isNull(clinicians.deletedAt)
        ))
      );

      if (duplicateEmployeeIdClinician) {
        return NextResponse.json({
          error: 'A clinician with this employee ID already exists in your organization'
        }, { status: 409 });
      }
    }

    // Prepare update values
    const updateValues: any = {
      updatedAt: new Date(),
    };

    // Only include fields that were provided in the request
    Object.keys(updateData).forEach(key => {
      const value = updateData[key as keyof typeof updateData];
      if (value !== undefined) {
        updateValues[key] = value;
      }
    });

    // Update the clinician record
    const { data: updatedClinician } = await safeUpdate(async () =>
      db.update(clinicians)
        .set(updateValues)
        .where(eq(clinicians.id, id))
        .returning()
    );

    if (!updatedClinician || updatedClinician.length === 0) {
      return NextResponse.json({ error: 'Failed to update clinician record' }, { status: 500 });
    }

    const clinician = updatedClinician[0] as any;

    // Format response
    const responseData = {
      id: clinician.id,
      organizationId: clinician.organizationId,
      firstName: clinician.firstName,
      lastName: clinician.lastName,
      middleName: clinician.middleName,
      suffix: clinician.suffix,
      employeeId: clinician.employeeId,
      npi: clinician.npi,
      licenseNumber: clinician.licenseNumber,
      title: clinician.title,
      department: clinician.department,
      specialty: clinician.specialty,
      credentials: clinician.credentials,
      email: clinician.email,
      phone: clinician.phone,
      hireDate: clinician.hireDate,
      employmentStatus: clinician.employmentStatus,
      canAccessPhi: clinician.canAccessPhi,
      accessLevel: clinician.accessLevel,
      isActive: clinician.isActive,
      createdAt: clinician.createdAt,
      updatedAt: clinician.updatedAt,
    };

    return NextResponse.json({
      message: 'Clinician updated successfully',
      clinician: responseData
    });

  } catch (error) {
    console.error('Error updating clinician:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/clinician/[id] - Soft delete a specific clinician record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Clinician ID is required' }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get the current clinician record to verify access
    const { data: existingClinician } = await safeSingle(async () =>
      db.select({
        id: clinicians.id,
        organizationId: clinicians.organizationId,
        firstName: clinicians.firstName,
        lastName: clinicians.lastName,
      })
      .from(clinicians)
      .where(and(
        eq(clinicians.id, id),
        isNull(clinicians.deletedAt)
      ))
    );

    if (!existingClinician) {
      return NextResponse.json({ error: 'Clinician not found' }, { status: 404 });
    }

    // Verify user has access to the organization and get team member info
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, existingClinician.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to delete this clinician'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions (only admins and owners can delete clinicians)
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can delete clinician records'
      }, { status: 403 });
    }

    // Soft delete the clinician record
    const { data: deletedClinician } = await safeUpdate(async () =>
      db.update(clinicians)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
          isActive: false,
        })
        .where(eq(clinicians.id, id))
        .returning({
          id: clinicians.id,
          firstName: clinicians.firstName,
          lastName: clinicians.lastName,
        })
    );

    if (!deletedClinician || deletedClinician.length === 0) {
      return NextResponse.json({ error: 'Failed to delete clinician record' }, { status: 500 });
    }

    const clinician = deletedClinician[0];

    return NextResponse.json({
      message: `Clinician ${clinician.firstName} ${clinician.lastName} has been successfully deleted`,
      clinician: {
        id: clinician.id,
        firstName: clinician.firstName,
        lastName: clinician.lastName,
      }
    });

  } catch (error) {
    console.error('Error deleting clinician:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
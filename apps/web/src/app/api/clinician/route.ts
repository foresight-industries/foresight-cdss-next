import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { clinicians, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schema for creating a clinician
const createClinicianSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),

  // Required fields
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),

  // Optional demographics
  middleName: z.string().max(100).optional(),
  suffix: z.string().max(10).optional(),

  // Identifiers
  employeeId: z.string().max(50).optional(),
  npi: z.string().length(10, 'NPI must be exactly 10 digits').regex(/^\d{10}$/, 'NPI must be digits only').optional(),
  licenseNumber: z.string().max(50).optional(),

  // Professional information
  title: z.string().max(50).optional(), // RN, LPN, MA, etc.
  department: z.string().max(50).optional(),
  specialty: z.string().optional(),
  credentials: z.string().optional(), // JSON array of certifications

  // Contact information
  email: z.email('Invalid email format').optional(),
  phone: z.string().max(20).optional(),

  // Employment
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  employmentStatus: z.enum(['active', 'inactive', 'terminated']).default('active'),

  // Access permissions
  canAccessPhi: z.boolean().default(false),
  accessLevel: z.enum(['none', 'read', 'write', 'admin', 'owner']).default('read'),
});

// POST /api/clinician - Create a new clinician record
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const rawData = await request.json();

    // Validate request data
    const validation = createClinicianSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const clinicianData = validation.data;

    // Verify user has access to the organization and get team member ID and user profile ID
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id,
        userProfileId: teamMembers.userProfileId
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, clinicianData.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to create clinicians for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
      userProfileId: string;
    };

    // Check if user has sufficient permissions (only admins and owners can create clinicians)
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can create clinician records'
      }, { status: 403 });
    }

    // Check if NPI is unique within the organization (if provided)
    if (clinicianData.npi) {
      const npiValue = clinicianData.npi;
      const { data: existingClinician } = await safeSingle(async () =>
        db.select({ id: clinicians.id })
        .from(clinicians)
        .where(and(
          eq(clinicians.organizationId, clinicianData.organizationId),
          eq(clinicians.npi, npiValue),
          isNull(clinicians.deletedAt)
        ))
      );

      if (existingClinician) {
        return NextResponse.json({
          error: 'A clinician with this NPI already exists in your organization'
        }, { status: 409 });
      }
    }

    // Check if employee ID is unique within the organization (if provided)
    if (clinicianData.employeeId) {
      const employeeIdValue = clinicianData.employeeId;
      const { data: existingClinician } = await safeSingle(async () =>
        db.select({ id: clinicians.id })
        .from(clinicians)
        .where(and(
          eq(clinicians.organizationId, clinicianData.organizationId),
          eq(clinicians.employeeId, employeeIdValue),
          isNull(clinicians.deletedAt)
        ))
      );

      if (existingClinician) {
        return NextResponse.json({
          error: 'A clinician with this employee ID already exists in your organization'
        }, { status: 409 });
      }
    }

    // Create the clinician record
    const { data: newClinician } = await safeInsert(async () =>
      db.insert(clinicians)
        .values({
          organizationId: clinicianData.organizationId,
          userProfileId: membershipData.userProfileId,
          teamMemberId: membershipData.teamMemberId,
          firstName: clinicianData.firstName,
          lastName: clinicianData.lastName,
          middleName: clinicianData.middleName || null,
          suffix: clinicianData.suffix || null,
          employeeId: clinicianData.employeeId || null,
          npi: clinicianData.npi || null,
          licenseNumber: clinicianData.licenseNumber || null,
          title: clinicianData.title || null,
          department: clinicianData.department || null,
          specialty: clinicianData.specialty || null,
          credentials: clinicianData.credentials || null,
          email: clinicianData.email || null,
          phone: clinicianData.phone || null,
          hireDate: clinicianData.hireDate || null,
          employmentStatus: clinicianData.employmentStatus,
          canAccessPhi: clinicianData.canAccessPhi,
          accessLevel: clinicianData.accessLevel,
          isActive: true,
          createdBy: membershipData.teamMemberId,
        })
        .returning()
    );

    if (!newClinician || newClinician.length === 0) {
      return NextResponse.json({ error: 'Failed to create clinician record' }, { status: 500 });
    }

    const createdClinician = newClinician[0] as any;

    // Format response
    const responseData = {
      id: createdClinician.id,
      organizationId: createdClinician.organizationId,
      firstName: createdClinician.firstName,
      lastName: createdClinician.lastName,
      middleName: createdClinician.middleName,
      suffix: createdClinician.suffix,
      employeeId: createdClinician.employeeId,
      npi: createdClinician.npi,
      licenseNumber: createdClinician.licenseNumber,
      title: createdClinician.title,
      department: createdClinician.department,
      specialty: createdClinician.specialty,
      credentials: createdClinician.credentials,
      email: createdClinician.email,
      phone: createdClinician.phone,
      hireDate: createdClinician.hireDate,
      employmentStatus: createdClinician.employmentStatus,
      canAccessPhi: createdClinician.canAccessPhi,
      accessLevel: createdClinician.accessLevel,
      isActive: createdClinician.isActive,
      createdAt: createdClinician.createdAt,
      updatedAt: createdClinician.updatedAt,
    };

    return NextResponse.json({
      message: 'Clinician created successfully',
      clinician: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating clinician:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/clinician - List clinicians for an organization
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search'); // Search by name, NPI, or email
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100); // Max 100 clinicians per request
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
        error: 'Access denied: You do not have permission to view clinicians for this organization'
      }, { status: 403 });
    }

    // Get clinicians for the organization
    const { data: cliniciansList } = await safeSelect(async () =>
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
        eq(clinicians.organizationId, organizationId),
        isNull(clinicians.deletedAt)
      ))
      .orderBy(clinicians.lastName, clinicians.firstName)
      .limit(limit)
      .offset(offset)
    );

    // Apply client-side search filtering if search term provided
    let filteredClinicians = cliniciansList || [];
    if (search?.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredClinicians = filteredClinicians.filter(clinician =>
        clinician.firstName.toLowerCase().includes(searchTerm) ||
        clinician.lastName.toLowerCase().includes(searchTerm) ||
        clinician.npi?.toLowerCase().includes(searchTerm) ||
        clinician.email?.toLowerCase().includes(searchTerm) ||
        clinician.employeeId?.toLowerCase().includes(searchTerm) ||
        clinician.department?.toLowerCase().includes(searchTerm) ||
        clinician.title?.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json({
      clinicians: filteredClinicians,
      pagination: {
        limit,
        offset,
        total: filteredClinicians.length,
        hasMore: filteredClinicians.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching clinicians:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
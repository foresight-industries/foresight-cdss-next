import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { priorAuths, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schema for creating an appeal
const createAppealSchema = z.object({
  // Appeal details
  appealNumber: z.string().max(50).optional(),
  appealLevel: z.enum(['first_level', 'second_level', 'third_level', 'external_review']).default('first_level'),
  appealType: z.string().max(50).optional(), // medical_necessity, authorization, coding, etc.

  // Dates
  appealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),

  // Financial
  appealedAmount: z.number().positive('Appealed amount must be positive'),

  // Appeal content
  appealReason: z.string().min(1, 'Appeal reason is required'),
  supportingDocuments: z.string().optional(), // JSON array of document IDs

  // External system identifiers
  externalAppealId: z.string().max(100).optional(),
  externalSystem: z.string().max(50).optional(),
});

// POST /api/prior-auth/appeal/[id] - Create an appeal for a prior authorization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: priorAuthId } = await params;
    const rawData = await request.json();

    if (!priorAuthId) {
      return NextResponse.json({ error: 'Prior authorization ID is required' }, { status: 400 });
    }

    // Validate request data
    const validation = createAppealSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const appealData = validation.data;
    const { db } = await createAuthenticatedDatabaseClient();

    // Get the prior authorization and verify it exists
    const { data: priorAuth } = await safeSingle(async () =>
      db.select({
        id: priorAuths.id,
        organizationId: priorAuths.organizationId,
        patientId: priorAuths.patientId,
        payerId: priorAuths.payerId,
        status: priorAuths.status,
        requestedService: priorAuths.requestedService,
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.id, priorAuthId),
        isNull(priorAuths.deletedAt)
      ))
    );

    if (!priorAuth) {
      return NextResponse.json({ error: 'Prior authorization not found' }, { status: 404 });
    }

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
        eq(teamMembers.organizationId, priorAuth.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to create appeals for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as {
      organizationId: string;
      role: string;
      teamMemberId: string;
    };

    // Check if user has sufficient permissions (providers, admins, and owners can create appeals)
    if (!['provider', 'admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only providers, admins, and owners can create appeals'
      }, { status: 403 });
    }

    // Check if PA is in a state that can be appealed (typically denied)
    if (priorAuth.status !== 'denied') {
      return NextResponse.json({
        error: 'Prior authorization must be denied before it can be appealed'
      }, { status: 400 });
    }

    // Update the prior authorization record with appeal information
    const { data: updatedPriorAuth } = await safeUpdate(async () =>
      db.update(priorAuths)
        .set({
          status: 'appealed' as any, // Add 'appealed' status to the enum if not present
          updatedAt: new Date(),
          updatedBy: membershipData.teamMemberId,
        })
        .where(eq(priorAuths.id, priorAuthId))
        .returning()
    );

    if (!updatedPriorAuth || updatedPriorAuth.length === 0) {
      return NextResponse.json({ error: 'Failed to update prior authorization for appeal' }, { status: 500 });
    }

    const updatedPA = updatedPriorAuth[0] as any;

    // Format response
    const responseData = {
      id: updatedPA.id,
      organizationId: updatedPA.organizationId,
      patientId: updatedPA.patientId,
      payerId: updatedPA.payerId,
      authNumber: updatedPA.authNumber,
      referenceNumber: updatedPA.referenceNumber,
      requestedService: updatedPA.requestedService,
      status: updatedPA.status,
      appealDate: updatedPA.appealDate,
      appealReason: updatedPA.appealReason,
      requestDate: updatedPA.requestDate,
      effectiveDate: updatedPA.effectiveDate,
      expirationDate: updatedPA.expirationDate,
      createdAt: updatedPA.createdAt,
      updatedAt: updatedPA.updatedAt,
      // Include appeal metadata
      appeal: {
        appealNumber: appealData.appealNumber || `APPEAL-${Date.now()}`,
        appealLevel: appealData.appealLevel,
        appealType: appealData.appealType || 'authorization',
        appealDate: appealData.appealDate,
        dueDate: appealData.dueDate,
        appealedAmount: appealData.appealedAmount,
        appealReason: appealData.appealReason,
        supportingDocuments: appealData.supportingDocuments,
        externalAppealId: appealData.externalAppealId,
        externalSystem: appealData.externalSystem,
      }
    };

    return NextResponse.json({
      message: 'Appeal created successfully',
      appeal: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating appeal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/prior-auth/appeal/[id] - Get appeal details for a prior authorization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: priorAuthId } = await params;

    if (!priorAuthId) {
      return NextResponse.json({ error: 'Prior authorization ID is required' }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get the prior authorization to verify access
    const { data: priorAuth } = await safeSingle(async () =>
      db.select({
        organizationId: priorAuths.organizationId,
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.id, priorAuthId),
        isNull(priorAuths.deletedAt)
      ))
    );

    if (!priorAuth) {
      return NextResponse.json({ error: 'Prior authorization not found' }, { status: 404 });
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
        eq(teamMembers.organizationId, priorAuth.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view appeals for this organization'
      }, { status: 403 });
    }

    // Get the prior authorization with appeal status
    const { data: priorAuthWithAppeal } = await safeSingle(async () =>
      db.select({
        id: priorAuths.id,
        organizationId: priorAuths.organizationId,
        patientId: priorAuths.patientId,
        payerId: priorAuths.payerId,
        authNumber: priorAuths.authNumber,
        referenceNumber: priorAuths.referenceNumber,
        requestedService: priorAuths.requestedService,
        status: priorAuths.status,
        requestDate: priorAuths.requestDate,
        effectiveDate: priorAuths.effectiveDate,
        expirationDate: priorAuths.expirationDate,
        createdAt: priorAuths.createdAt,
        updatedAt: priorAuths.updatedAt,
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.id, priorAuthId),
        isNull(priorAuths.deletedAt)
      ))
    );

    return NextResponse.json({
      priorAuthId: priorAuthId,
      priorAuth: priorAuthWithAppeal,
      hasAppeal: priorAuthWithAppeal?.status !== 'pending' && priorAuthWithAppeal?.status !== 'approved' && priorAuthWithAppeal?.status !== 'denied' && priorAuthWithAppeal?.status !== 'cancelled' && priorAuthWithAppeal?.status !== 'expired'
    });

  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

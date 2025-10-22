import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { priorAuths, priorAuthAppeals, teamMembers, userProfiles, clinicians } from '@foresight-cdss-next/db';
import { z } from 'zod';
import { createDosespotToken } from '../../../services/dosespot/_utils/createDosespotToken';
import axios from 'axios';

// Validation schema for creating an appeal
const createAppealSchema = z.object({
  // Appeal details
  appealNumber: z.string().max(50).optional(),
  appealLevel: z.enum(['first_level', 'second_level', 'third_level', 'external_review']).default('first_level'),
  appealType: z.string().max(50).optional(), // medical_necessity, authorization, coding, etc.

  // Dates
  appealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),

  // Appeal content
  appealReason: z.string().min(1, 'Appeal reason is required'),
  clinicalJustification: z.string().optional(),
  medicalNecessityRationale: z.string().optional(),
  additionalDocumentation: z.string().optional(),
  
  // Original denial details
  originalDenialReason: z.string().optional(),
  originalDenialCode: z.string().max(20).optional(),
  originalDenialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  
  // Processing
  submissionMethod: z.enum(['portal', 'mail', 'fax', 'phone', 'api']).optional(),
  confirmationNumber: z.string().max(50).optional(),
  
  // Clinical attachments/evidence
  attachedDocuments: z.string().optional(), // JSON array of document references
  letterOfMedicalNecessity: z.string().optional(),

  // DoseSpot integration fields
  dosespot: z.object({
    autoAppeal: z.boolean().default(false),
  }).optional(),
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
        providerId: priorAuths.providerId,
        status: priorAuths.status,
        requestedService: priorAuths.requestedService,
        dosespotCaseId: priorAuths.dosespotCaseId,
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

    // Create the appeal record in the prior_auth_appeal table
    const { data: createdAppeal } = await safeUpdate(async () =>
      db.insert(priorAuthAppeals)
        .values({
          organizationId: priorAuth.organizationId,
          priorAuthId: priorAuthId,
          patientId: priorAuth.patientId,
          payerId: priorAuth.payerId,
          providerId: priorAuth.providerId!,
          appealNumber: appealData.appealNumber || `APPEAL-${Date.now()}`,
          appealLevel: appealData.appealLevel,
          appealType: appealData.appealType,
          appealDate: appealData.appealDate,
          dueDate: appealData.dueDate,
          appealReason: appealData.appealReason,
          clinicalJustification: appealData.clinicalJustification,
          medicalNecessityRationale: appealData.medicalNecessityRationale,
          additionalDocumentation: appealData.additionalDocumentation,
          originalDenialReason: appealData.originalDenialReason,
          originalDenialCode: appealData.originalDenialCode,
          originalDenialDate: appealData.originalDenialDate,
          submissionMethod: appealData.submissionMethod,
          confirmationNumber: appealData.confirmationNumber,
          attachedDocuments: appealData.attachedDocuments,
          letterOfMedicalNecessity: appealData.letterOfMedicalNecessity,
          createdBy: membershipData.teamMemberId,
          updatedBy: membershipData.teamMemberId,
        })
        .returning()
    );

    if (!createdAppeal || createdAppeal.length === 0) {
      return NextResponse.json({ error: 'Failed to create appeal record' }, { status: 500 });
    }

    const appealRecord = createdAppeal[0];

    // Update the prior authorization status to 'appealed'
    const { data: updatedPriorAuth } = await safeUpdate(async () =>
      db.update(priorAuths)
        .set({
          status: 'appealed' as any,
          updatedAt: new Date(),
          updatedBy: membershipData.teamMemberId,
        })
        .where(eq(priorAuths.id, priorAuthId))
        .returning()
    );

    if (!updatedPriorAuth || updatedPriorAuth.length === 0) {
      return NextResponse.json({ error: 'Failed to update prior authorization status' }, { status: 500 });
    }

    const updatedPA = updatedPriorAuth[0] as any;

    // DoseSpot Integration: Auto-appeal if requested and PA has DoseSpot case ID
    let dosespotAppealError = null;
    let dosespotAppealSuccess = false;

    if (appealData.dosespot?.autoAppeal && priorAuth.dosespotCaseId) {
      try {
        // Get the clinician's DoseSpot provider ID through team member relationship
        const { data: clinician } = await safeSingle(async () =>
          db.select({
            dosespotProviderId: clinicians.dosespotProviderId,
          })
          .from(clinicians)
          .where(and(
            eq(clinicians.organizationId, priorAuth.organizationId),
            eq(clinicians.teamMemberId, membershipData.teamMemberId),
            isNull(clinicians.deletedAt)
          ))
        );

        if (!clinician?.dosespotProviderId) {
          dosespotAppealError = 'DoseSpot provider ID not found for this provider';
        } else {
          // Create DoseSpot token and appeal the prior auth
          const { data: token } = await createDosespotToken(clinician.dosespotProviderId);
          
          const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${priorAuth.dosespotCaseId}/appeal`;
          
          const appealRequest = {
            method: 'POST',
            headers: {
              'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
              Authorization: `Bearer ${token.access_token}`,
              'Content-Type': 'application/json',
            },
            url: url,
            data: { AppealReason: appealData.appealReason.trim() },
          };

          const response = await axios(appealRequest);
          dosespotAppealSuccess = true;
          console.log('DoseSpot appeal submitted successfully:', response.data);
        }
      } catch (error) {
        console.error('DoseSpot appeal error:', error);
        dosespotAppealError = `Failed to submit DoseSpot appeal: ${(error as Error).message}`;
      }
    }

    // Format response
    const responseData = {
      // Prior authorization data
      priorAuth: {
        id: updatedPA.id,
        organizationId: updatedPA.organizationId,
        patientId: updatedPA.patientId,
        payerId: updatedPA.payerId,
        authNumber: updatedPA.authNumber,
        referenceNumber: updatedPA.referenceNumber,
        requestedService: updatedPA.requestedService,
        status: updatedPA.status,
        requestDate: updatedPA.requestDate,
        effectiveDate: updatedPA.effectiveDate,
        expirationDate: updatedPA.expirationDate,
        createdAt: updatedPA.createdAt,
        updatedAt: updatedPA.updatedAt,
      },
      // Appeal data from the new appeal record
      appeal: {
        id: appealRecord.id,
        appealNumber: appealRecord.appealNumber,
        appealLevel: appealRecord.appealLevel,
        appealType: appealRecord.appealType,
        appealDate: appealRecord.appealDate,
        dueDate: appealRecord.dueDate,
        status: appealRecord.status,
        appealReason: appealRecord.appealReason,
        clinicalJustification: appealRecord.clinicalJustification,
        medicalNecessityRationale: appealRecord.medicalNecessityRationale,
        additionalDocumentation: appealRecord.additionalDocumentation,
        originalDenialReason: appealRecord.originalDenialReason,
        originalDenialCode: appealRecord.originalDenialCode,
        originalDenialDate: appealRecord.originalDenialDate,
        submissionMethod: appealRecord.submissionMethod,
        confirmationNumber: appealRecord.confirmationNumber,
        attachedDocuments: appealRecord.attachedDocuments,
        letterOfMedicalNecessity: appealRecord.letterOfMedicalNecessity,
        createdAt: appealRecord.createdAt,
        updatedAt: appealRecord.updatedAt,
      },
      // Include DoseSpot appeal results
      dosespot: appealData.dosespot?.autoAppeal ? {
        appealed: dosespotAppealSuccess,
        caseId: priorAuth.dosespotCaseId,
        error: dosespotAppealError,
      } : null,
    };

    return NextResponse.json({
      message: 'Appeal created successfully',
      data: responseData
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

    // Get the prior authorization details
    const { data: priorAuthData } = await safeSingle(async () =>
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

    // Get all appeals for this prior authorization
    const { data: appeals } = await safeSelect(async () =>
      db.select({
        id: priorAuthAppeals.id,
        appealNumber: priorAuthAppeals.appealNumber,
        appealLevel: priorAuthAppeals.appealLevel,
        appealType: priorAuthAppeals.appealType,
        appealDate: priorAuthAppeals.appealDate,
        dueDate: priorAuthAppeals.dueDate,
        responseDate: priorAuthAppeals.responseDate,
        status: priorAuthAppeals.status,
        appealReason: priorAuthAppeals.appealReason,
        clinicalJustification: priorAuthAppeals.clinicalJustification,
        medicalNecessityRationale: priorAuthAppeals.medicalNecessityRationale,
        additionalDocumentation: priorAuthAppeals.additionalDocumentation,
        originalDenialReason: priorAuthAppeals.originalDenialReason,
        originalDenialCode: priorAuthAppeals.originalDenialCode,
        originalDenialDate: priorAuthAppeals.originalDenialDate,
        submissionMethod: priorAuthAppeals.submissionMethod,
        confirmationNumber: priorAuthAppeals.confirmationNumber,
        payerResponse: priorAuthAppeals.payerResponse,
        responseReason: priorAuthAppeals.responseReason,
        finalDecision: priorAuthAppeals.finalDecision,
        attachedDocuments: priorAuthAppeals.attachedDocuments,
        letterOfMedicalNecessity: priorAuthAppeals.letterOfMedicalNecessity,
        escalatedToExternalReview: priorAuthAppeals.escalatedToExternalReview,
        externalReviewOrganization: priorAuthAppeals.externalReviewOrganization,
        externalReviewNumber: priorAuthAppeals.externalReviewNumber,
        createdAt: priorAuthAppeals.createdAt,
        updatedAt: priorAuthAppeals.updatedAt,
      })
      .from(priorAuthAppeals)
      .where(and(
        eq(priorAuthAppeals.priorAuthId, priorAuthId),
        isNull(priorAuthAppeals.deletedAt)
      ))
      .orderBy(priorAuthAppeals.createdAt)
    );

    return NextResponse.json({
      priorAuthId: priorAuthId,
      priorAuth: priorAuthData,
      appeals: appeals || [],
      hasAppeal: (appeals && appeals.length > 0)
    });

  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

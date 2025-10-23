import { NextRequest } from 'next/server';
import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import {
  clinicians,
  patients,
  teamMembers,
  userProfiles
} from '@foresight-cdss-next/db';
import { addAndSendSupply } from '../../_utils/addAndSendSupply';
import { z } from 'zod';

// Validation schema for the supply request
const dosespotSupplySchema = z.object({
  dosespotPatientId: z.number(),
  supply: z.object({
    SupplyId: z.number(),
    Refills: z.number(),
    DispenseUnitId: z.number(),
    Quantity: z.number(),
    Directions: z.string(),
    Status: z.number(),
    NoSubstitutions: z.boolean(),
    PharmacyNotes: z.string(),
    DaysSupply: z.number(),
    PharmacyId: z.number(),
  }),
  clinicianId: z.uuid().optional(),
  organizationId: z.uuid().optional(),
});

// POST /api/services/dosespot/supply/add-and-send - Add and send supply through DoseSpot
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const validation = dosespotSupplySchema.safeParse({
      dosespotPatientId: rawBody.dosespot_patient_id || rawBody.dosespotPatientId,
      supply: rawBody.supply,
      clinicianId: rawBody.clinicianId,
      organizationId: rawBody.organizationId,
    });

    if (!validation.success) {
      return Response.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const data = validation.data;

    // Check authentication - support both user auth and webhook auth
    const { userId } = await auth();
    const isWebhookRequest = request.headers.get('dosespot-webhook-signature') === process.env.DOSESPOT_WEBHOOK_SECRET;

    if (!userId && !isWebhookRequest) {
      return Response.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { db } = createDatabaseAdminClient();

    // Get patient by DoseSpot ID
    const { data: patient } = await safeSingle(async () =>
      db.select({
        id: patients.id,
        organizationId: patients.organizationId,
        dosespotPatientId: patients.dosespotPatientId,
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(patients)
      .where(and(
        eq(patients.dosespotPatientId, data.dosespotPatientId),
        isNull(patients.deletedAt)
      ))
    );

    if (!patient) {
      return Response.json({
        error: 'Patient not found',
        message: `No patient found with DoseSpot ID: ${data.dosespotPatientId}`
      }, { status: 404 });
    }

    // Get clinician - either by provided ID or by user authentication
    let clinician;
    if (data.clinicianId) {
      // Get clinician by ID (for webhook requests)
      const { data: clinicianData } = await safeSingle(async () =>
        db.select({
          id: clinicians.id,
          organizationId: clinicians.organizationId,
          dosespotProviderId: clinicians.dosespotProviderId,
          firstName: clinicians.firstName,
          lastName: clinicians.lastName,
        })
        .from(clinicians)
        .where(and(
          eq(clinicians.id, data.clinicianId!),
          isNull(clinicians.deletedAt)
        ))
      );
      clinician = clinicianData;
    } else if (userId) {
      // For authenticated requests, find a clinician in the patient's organization
      // This follows the pattern used by other DoseSpot endpoints
      const { data: clinicianData } = await safeSingle(async () =>
        db.select({
          id: clinicians.id,
          organizationId: clinicians.organizationId,
          dosespotProviderId: clinicians.dosespotProviderId,
          firstName: clinicians.firstName,
          lastName: clinicians.lastName,
        })
        .from(clinicians)
        .where(and(
          eq(clinicians.organizationId, patient.organizationId),
          isNull(clinicians.deletedAt)
        ))
      );
      clinician = clinicianData;
    }

    if (!clinician?.dosespotProviderId) {
      return Response.json({
        error: 'Clinician not found or not authorized',
        message: 'Clinician must have a valid DoseSpot provider ID'
      }, { status: 404 });
    }

    // Verify patient and clinician belong to same organization
    if (patient.organizationId !== clinician.organizationId) {
      return Response.json({
        error: 'Organization mismatch',
        message: 'Patient and clinician must belong to the same organization'
      }, { status: 403 });
    }

    // If user authentication, verify they have access to this organization
    if (userId) {
      const { data: membership } = await safeSingle(async () =>
        db.select({
          organizationId: teamMembers.organizationId,
          role: teamMembers.role,
        })
        .from(teamMembers)
        .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
        .where(and(
          eq(userProfiles.clerkUserId, userId),
          eq(teamMembers.organizationId, patient.organizationId),
          eq(teamMembers.isActive, true)
        ))
      );

      if (!membership) {
        return Response.json({
          error: 'Access denied',
          message: 'User does not have access to this organization'
        }, { status: 403 });
      }
    }

    console.log(`Adding and sending supply for ID ${data.supply.SupplyId} to DoseSpot patient ${data.dosespotPatientId}`);

    // Process the supply through DoseSpot
    const prescriptionId = await addAndSendSupply({
      supply: data.supply,
      clinician: {
        id: 0, // Legacy numeric ID not used in AWS schema - placeholder value
        dosespot_provider_id: clinician.dosespotProviderId,
        profile_id: '',
      },
      dosespot_patient_id: data.dosespotPatientId,
    });

    return Response.json({
      success: true,
      prescriptionId,
      message: 'Supply successfully added and sent via DoseSpot'
    });

  } catch (error) {
    console.error('Error in DoseSpot supply endpoint:', error);
    return Response.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

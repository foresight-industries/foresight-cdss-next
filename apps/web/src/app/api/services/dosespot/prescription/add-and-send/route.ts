import { NextRequest } from 'next/server';
import { createDatabaseAdminClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { addAndSendPrescription } from '../../_utils/addAndSendPrescription';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull, like, desc, count } from 'drizzle-orm';
import {
  clinicians,
  patients,
  teamMembers,
  userProfiles,
  priorAuths,
  medications
} from '@foresight-cdss-next/db';
import { z } from 'zod';

// Validation schema for the request
const dosespotPrescriptionSchema = z.object({
  dosespotPatientId: z.number(),
  prescription: z.object({
    DispensableDrugId: z.number(),
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
  medication: z.string(),
  patientId: z.uuid(),
  clinicianId: z.uuid(),
  initiatePA: z.boolean().default(false),
  prescribeWithoutCharge: z.boolean().default(false),
  organizationId: z.uuid().optional(),
});

// Create medication record for prescription tracking
const createMedicationRecord = async (
  db: ReturnType<typeof createDatabaseAdminClient>['db'],
  organizationId: string,
  patientId: string,
  providerId: string,
  prescriptionData: {
    prescriptionId: number;
    medication: string;
    dosage: string;
    quantity: number;
    directions: string;
    refills: number;
    daysSupply: number;
    pharmacyId: number;
  },
  createdBy: string
) => {
  try {
    const insertResult = await db.insert(medications)
      .values({
        organizationId,
        patientId,
        providerId,
        medicationName: prescriptionData.medication,
        dosage: prescriptionData.dosage,
        directions: prescriptionData.directions,
        quantity: prescriptionData.quantity,
        prescriptionNumber: prescriptionData.prescriptionId.toString(),
        refillsAllowed: prescriptionData.refills,
        daysSupply: prescriptionData.daysSupply,
        prescribedDate: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        indication: `DoseSpot Prescription ID: ${prescriptionData.prescriptionId}, Pharmacy ID: ${prescriptionData.pharmacyId}`,
      })
      .returning();

    return Array.isArray(insertResult) && insertResult.length > 0 ? insertResult[0] : null;
  } catch (error) {
    console.error('Error creating medication record:', error);
    return null;
  }
};

// Update prior auth status when prescription is approved
const updatePriorAuthForPrescription = async (
  db: ReturnType<typeof createDatabaseAdminClient>['db'],
  patientId: string,
  medication: string,
  updatedBy: string
) => {
  // Find latest approved prior auth for this medication
  const priorAuthResult = await db.select()
    .from(priorAuths)
    .where(and(
      eq(priorAuths.patientId, patientId),
      like(priorAuths.requestedService, `%${medication}%`),
      eq(priorAuths.status, 'approved'),
      isNull(priorAuths.deletedAt)
    ))
    .orderBy(desc(priorAuths.createdAt))
    .limit(1);

  if (priorAuthResult && Array.isArray(priorAuthResult) && priorAuthResult.length > 0) {
    const latestPriorAuth = priorAuthResult[0];

    // Update status to indicate prescription was filled
    await safeUpdate(async () =>
      db.update(priorAuths)
        .set({
          // Note: We would need to add a "prescribed" status to the enum
          // For now, we'll add a note to the clinical notes
          clinicalNotes: `${latestPriorAuth.clinicalNotes || ''} - Prescription filled via DoseSpot on ${new Date().toISOString()}`,
          updatedAt: new Date(),
          updatedBy,
        })
        .where(eq(priorAuths.id, latestPriorAuth.id))
        .returning()
    );

    console.log('Updated prior_auth entry:', latestPriorAuth.id);
  }
};

// Create a new prior authorization request
const createPriorAuthRequest = async (
  db: ReturnType<typeof createDatabaseAdminClient>['db'],
  organizationId: string,
  patientId: string,
  providerId: string,
  payerId: string,
  medication: string,
  createdBy: string
) => {
  const referenceNumber = `PA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const insertResult = await db.insert(priorAuths)
      .values({
        organizationId,
        patientId,
        providerId,
        payerId,
        referenceNumber,
        requestedService: `${medication} prescription`,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        clinicalNotes: `DoseSpot prescription request for ${medication}`,
        submissionMethod: 'portal',
        createdBy,
      })
      .returning();

    return Array.isArray(insertResult) && insertResult.length > 0 ? insertResult[0] : null;
  } catch (error) {
    console.error('Error creating prior auth request:', error);
    return null;
  }
};

// Supported weight loss medications that may require PA
const WEIGHT_LOSS_MEDICATIONS = [
  'Mounjaro',
  'Zepbound',
  'Saxenda',
  'Victoza',
  'Wegovy',
  'Ozempic',
] as const;

// POST /api/services/dosespot/prescription/add-and-send - Add and send prescription through DoseSpot
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const validation = dosespotPrescriptionSchema.safeParse({
      dosespotPatientId: rawBody.dosespot_patient_id || rawBody.dosespotPatientId,
      prescription: rawBody.prescription,
      medication: rawBody.medication,
      patientId: rawBody.patientId,
      clinicianId: rawBody.clinicianId,
      initiatePA: rawBody.initiatePA || false,
      prescribeWithoutCharge: rawBody.prescribeWithoutCharge || false,
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

    // Get clinician by ID
    const { data: clinician } = await safeSingle(async () =>
      db.select({
        id: clinicians.id,
        organizationId: clinicians.organizationId,
        dosespotProviderId: clinicians.dosespotProviderId,
        firstName: clinicians.firstName,
        lastName: clinicians.lastName,
      })
        .from(clinicians)
        .where(and(
          eq(clinicians.id, data.clinicianId),
          isNull(clinicians.deletedAt)
        ))
    );

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
          teamMemberId: teamMembers.id,
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

    // Check if prescription requires prior authorization
    if (data.initiatePA && (WEIGHT_LOSS_MEDICATIONS as readonly string[]).includes(data.medication)) {
      console.log(`Initiating PA for medication: ${data.medication}`);

      // Check existing PA count for patient (limit to 3)
      const { data: existingPAs } = await safeSingle(async () =>
        db.select({ count: count() })
          .from(priorAuths)
          .where(and(
            eq(priorAuths.patientId, patient.id),
            isNull(priorAuths.deletedAt)
          ))
      );

      if (existingPAs && Number(existingPAs.count) >= 3) {
        return Response.json({
          error: 'Prior authorization limit reached',
          message: 'Cannot create more than 3 prior authorizations for patient'
        }, { status: 400 });
      }

      // For now, we'll assume a default payer - in practice this should come from patient insurance
      // This would need to be enhanced to get the actual payer from patient's insurance information
      const defaultPayerId = '00000000-0000-0000-0000-000000000001'; // Placeholder

      // Create prior authorization request
      const newPA = await createPriorAuthRequest(
        db,
        patient.organizationId,
        patient.id,
        clinician.id,
        defaultPayerId,
        data.medication,
        userId || 'system' // Use system if webhook request
      );

      return Response.json({
        message: 'Prior authorization initiated',
        priorAuthId: newPA?.id || null,
        status: 'pending_authorization'
      });
    }

    // Process the prescription through DoseSpot
    console.log(`Adding and sending prescription for drug ID ${data.prescription.DispensableDrugId}`);

    const prescriptionId = await addAndSendPrescription({
      prescription: data.prescription,
      clinician: {
        id: Number(clinician.id),
        dosespot_provider_id: clinician.dosespotProviderId,
        profile_id: '',
      } as const,
      dosespot_patient_id: data.dosespotPatientId,
    });

    // Create medication record for tracking
    const medicationRecord = await createMedicationRecord(
      db,
      patient.organizationId,
      patient.id,
      clinician.id,
      {
        prescriptionId,
        medication: data.medication,
        dosage: data.prescription.Directions.split(' ')[0] || '1',
        quantity: data.prescription.Quantity,
        directions: data.prescription.Directions,
        refills: data.prescription.Refills,
        daysSupply: data.prescription.DaysSupply,
        pharmacyId: data.prescription.PharmacyId,
      },
      userId || 'system'
    );

    // Update any relevant prior authorizations
    await updatePriorAuthForPrescription(
      db,
      patient.id,
      data.medication,
      userId || 'system'
    );

    return Response.json({
      success: true,
      prescriptionId,
      medicationRecordId: medicationRecord?.id || null,
      message: 'Prescription successfully added and sent via DoseSpot'
    });

  } catch (error) {
    console.error('Error in DoseSpot prescription endpoint:', error);
    return Response.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@foresight-cdss-next/db';
import {
  priorAuths,
  patients,
  providers,
  payers,
  prescription,
} from '@foresight-cdss-next/db/schema';
import { and, eq, desc, count, isNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import type { QueueItem, QueueData } from '@/types/queue';
import { requireTeamMembership } from '@/lib/team';

export type { QueueItem, QueueData };

export async function GET(request: NextRequest) {
  try {
    // Get current user and organization
    const { isAuthenticated } = await auth();

    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const payerFilter = searchParams.get('payer');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [
      eq(priorAuths.organizationId, organizationId!),
      isNull(priorAuths.deletedAt)
    ];

    if (statusFilter) {
      whereConditions.push(eq(priorAuths.status, statusFilter as any));
    }

    if (payerFilter) {
      // We'll need to join with payers table for this filter
    }

    // Fetch prior authorization data with joins
    const priorAuthsQuery = db
      .select({
        // Prior auth fields
        id: priorAuths.id,
        authNumber: priorAuths.authNumber,
        requestedService: priorAuths.requestedService,
        diagnosisCodes: priorAuths.diagnosisCodes,
        status: priorAuths.status,
        dosespotCaseId: priorAuths.dosespotCaseId,
        clinicalNotes: priorAuths.clinicalNotes,
        updatedAt: priorAuths.updatedAt,
        createdAt: priorAuths.createdAt,
        prescriptionId: priorAuths.prescriptionId,
        providerId: priorAuths.providerId,
        payerId: priorAuths.payerId,

        // Patient info
        patientId: patients.id,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,

        // Provider info
        providerFirstName: providers.firstName,
        providerLastName: providers.lastName,

        // Payer info
        payerName: payers.name,

        // Prescription info
        medicationName: prescription.medicationName,
        medicationStrength: prescription.medicationStrength,
      })
      .from(priorAuths)
      .innerJoin(patients, eq(priorAuths.patientId, patients.id))
      .innerJoin(providers, eq(priorAuths.providerId, providers.id))
      .innerJoin(payers, eq(priorAuths.payerId, payers.id))
      .leftJoin(prescription, eq(priorAuths.prescriptionId, prescription.id))
      .where(and(...whereConditions))
      .orderBy(desc(priorAuths.updatedAt))
      .limit(limit)
      .offset(offset);

    const results = await priorAuthsQuery;

    // Transform results to match queue item interface
    const items: QueueItem[] = results.map(result => {
      // Parse diagnosis codes to get conditions
      let conditions = 'Unknown';
      try {
        const diagnosisCodes = result.diagnosisCodes ? JSON.parse(result.diagnosisCodes) : [];
        conditions = diagnosisCodes.length > 0 ? diagnosisCodes.join(', ') : 'Unknown';
      } catch {
        conditions = 'Unknown';
      }

      // Determine attempt type based on status and creation pattern
      let attempt = 'Initial PA Request';
      if (result.authNumber) {
        attempt = 'Prior Auth - Resubmission';
      }
      if (result.status === 'denied') {
        attempt = 'Appeal Request';
      }

      // Calculate confidence score based on various factors
      let confidence = 75; // Base confidence
      if (result.clinicalNotes && result.clinicalNotes.length > 100) confidence += 10;
      if (result.authNumber) confidence += 5;
      if (result.diagnosisCodes) {
        try {
          const codes = JSON.parse(result.diagnosisCodes);
          if (codes.length > 0) confidence += 5;
        } catch {
          console.error('Error parsing diagnosis codes:', result.diagnosisCodes);
        }
      }
      confidence = Math.min(confidence, 99);

      // Map status to queue status
      let queueStatus: QueueItem['status'] = 'needs-review';
      switch (result.status) {
        case 'pending':
          queueStatus = 'auto-processing';
          break;
        case 'approved':
          queueStatus = 'auto-approved';
          break;
        case 'denied':
          queueStatus = 'denied';
          break;
        case 'expired':
          queueStatus = 'denied'; // Treat expired as denied for queue purposes
          break;
        case 'cancelled':
          queueStatus = 'denied'; // Treat cancelled as denied for queue purposes
          break;
        default:
          queueStatus = 'needs-review';
      }

      return {
        id: result.authNumber || result.id,
        patientName: `${result.patientFirstName} ${result.patientLastName}`,
        patientId: result.patientId,
        conditions,
        attempt,
        medication: result.medicationName
          ? `${result.medicationName}${result.medicationStrength ? ' ' + result.medicationStrength : ''}`
          : result.requestedService || 'Unknown Medication',
        payer: result.payerName || 'Unknown Payer',
        status: queueStatus,
        confidence,
        updatedAt: result.updatedAt.toISOString(),
        dosespotCaseId: result.dosespotCaseId || undefined,
        authNumber: result.authNumber || undefined,
        requestedService: result.requestedService || undefined,
        clinicalNotes: result.clinicalNotes || undefined,
        prescriptionId: result.prescriptionId ? result.prescriptionId.toString() : undefined,
        providerId: result.providerId,
        payerId: result.payerId,
      };
    });

    // Get status counts
    const statusCountsQuery = await db
      .select({
        status: priorAuths.status,
        count: count()
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.organizationId, organizationId!),
        isNull(priorAuths.deletedAt)
      ))
      .groupBy(priorAuths.status);

    const statusCounts: Record<string, number> = {};
    statusCountsQuery.forEach(row => {
      // Map database status to queue status
      let queueStatus = 'needs-review';
      switch (row.status) {
        case 'pending':
          queueStatus = 'auto-processing';
          break;
        case 'approved':
          queueStatus = 'auto-approved';
          break;
        case 'denied':
        case 'expired':
        case 'cancelled':
          queueStatus = 'denied';
          break;
        default:
          queueStatus = 'needs-review';
      }
      statusCounts[queueStatus] = (statusCounts[queueStatus] || 0) + row.count;
    });

    // Get payer counts
    const payerCountsQuery = await db
      .select({
        payerName: payers.name,
        count: count()
      })
      .from(priorAuths)
      .innerJoin(payers, eq(priorAuths.payerId, payers.id))
      .where(and(
        eq(priorAuths.organizationId, organizationId!),
        isNull(priorAuths.deletedAt)
      ))
      .groupBy(payers.name);

    const payerCounts: Record<string, number> = {};
    payerCountsQuery.forEach(row => {
      payerCounts[row.payerName || 'Unknown'] = row.count;
    });

    // Get medication counts
    const medicationCountsQuery = await db
      .select({
        requestedService: priorAuths.requestedService,
        medicationName: prescription.medicationName,
        count: count()
      })
      .from(priorAuths)
      .leftJoin(prescription, eq(priorAuths.prescriptionId, prescription.id))
      .where(and(
        eq(priorAuths.organizationId, organizationId!),
        isNull(priorAuths.deletedAt)
      ))
      .groupBy(priorAuths.requestedService, prescription.medicationName);

    const medicationCounts: Record<string, number> = {};
    medicationCountsQuery.forEach(row => {
      const medicationName = row.medicationName || row.requestedService || 'Unknown';
      medicationCounts[medicationName] = (medicationCounts[medicationName] || 0) + row.count;
    });

    // Get total count
    const totalCountQuery = await db
      .select({ count: count() })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.organizationId, organizationId!),
        isNull(priorAuths.deletedAt)
      ));

    const totalItems = totalCountQuery[0]?.count || 0;

    const queueData: QueueData = {
      items,
      statusCounts,
      payerCounts,
      medicationCounts,
      totalItems
    };

    return NextResponse.json(queueData);

  } catch (error) {
    console.error('Error fetching queue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue data' },
      { status: 500 }
    );
  }
}

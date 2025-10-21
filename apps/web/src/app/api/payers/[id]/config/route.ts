import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { teamMembers, payerConfigs, payerContracts } from '@foresight-cdss-next/db';
import type { CreatePayerConfigRequest } from '@/types/payer.types';

// GET - Get payer configurations
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const payerId = params.id;

    // Verify user has access to this payer
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    const memberData = member[0] as any;

    // Get payer configurations
    const { data: configs, error } = await safeSelect(async () =>
      db.select()
        .from(payerConfigs)
        .where(and(
          eq(payerConfigs.payerId, payerId),
          eq(payerConfigs.organizationId, memberData.organizationId)
        ))
    );

    if (error) {
      console.error('Error fetching payer configs:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      configs: configs || []
    });

  } catch (error) {
    console.error('Payer config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create payer configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const payerId = params.id;
    const body: CreatePayerConfigRequest = await request.json();

    // Validate request body based on the actual payerConfigs schema
    const {
      submissionMethod,
      clearinghouseId,
      requiresPriorAuth,
      priorAuthTypes,
      maxClaimsPerBatch,
      submissionFrequency
    } = body as any;

    if (!submissionMethod) {
      return NextResponse.json({
        error: 'submissionMethod is required'
      }, { status: 400 });
    }

    // Get user's current team and verify admin permissions
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    const memberData = member[0] as any;
    if (!['super_admin', 'admin'].includes(memberData.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify payer contract exists for organization
    const { data: payerContract } = await safeSingle(async () =>
      db.select({ id: payerContracts.id })
        .from(payerContracts)
        .where(and(
          eq(payerContracts.payerId, payerId),
          eq(payerContracts.organizationId, memberData.organizationId)
        ))
    );

    if (!payerContract) {
      return NextResponse.json({ error: 'Payer not found for this organization' }, { status: 404 });
    }

    // Check if config already exists
    const { data: existingConfig } = await safeSingle(async () =>
      db.select({ id: payerConfigs.id })
        .from(payerConfigs)
        .where(and(
          eq(payerConfigs.payerId, payerId),
          eq(payerConfigs.organizationId, memberData.organizationId)
        ))
    );

    if (existingConfig) {
      return NextResponse.json({
        error: 'Configuration already exists. Use PUT to update.'
      }, { status: 409 });
    }

    // Create payer configuration
    const { data: config, error } = await safeInsert(async () =>
      db.insert(payerConfigs)
        .values({
          organizationId: memberData.organizationId,
          payerId: payerId,
          submissionMethod: submissionMethod,
          clearinghouseId: clearinghouseId || null,
          requiresPriorAuth: requiresPriorAuth || false,
          priorAuthTypes: priorAuthTypes || null,
          maxClaimsPerBatch: maxClaimsPerBatch || 100,
          submissionFrequency: submissionFrequency || null,
          // Note: autoSubmit, retryAttempts, and notificationSettings fields don't exist in the schema
        })
        .returning()
    );

    if (error || !config || config.length === 0) {
      console.error('Error creating payer config:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      config: config[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Payer config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

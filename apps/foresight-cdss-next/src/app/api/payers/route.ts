import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, desc } from 'drizzle-orm';
import { teamMembers, payers, payerContracts, payerConfigs, payerPortalCredentials, claims, priorAuths } from '@foresight-cdss-next/db';
import type { CreatePayerRequest, PayerWithConfig } from '@/types/payer.types';

// GET - List payers and their configurations for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const includePopular = searchParams.get('include_popular') === 'true';

    // Get user's current team membership
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

    // Get team's configured payers through contracts
    const { data: payerList, error } = await safeSelect(async () =>
      db.select({
        id: payers.id,
        name: payers.name,
        createdAt: payers.createdAt,
        updatedAt: payers.updatedAt
      })
      .from(payers)
      .innerJoin(payerContracts, eq(payers.id, payerContracts.payerId))
      .where(eq(payerContracts.organizationId, memberData.organizationId))
      .orderBy(payers.name)
    );

    if (error) {
      console.error('Error fetching payers:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Calculate performance stats for each payer
    const payersWithConfig: PayerWithConfig[] = [];
    
    for (const payer of payerList || []) {
      const payerData = payer as any;
      
      // Get payer config
      const { data: config } = await safeSingle(async () =>
        db.select()
        .from(payerConfigs)
        .where(and(
          eq(payerConfigs.payerId, payerData.id),
          eq(payerConfigs.organizationId, memberData.organizationId)
        ))
      );

      // Get portal credentials (without sensitive data)
      const { data: portalCredential } = await safeSingle(async () =>
        db.select({
          id: payerPortalCredentials.id,
          portalUrl: payerPortalCredentials.portalUrl,
          username: payerPortalCredentials.username,
          lastLoginAt: payerPortalCredentials.lastLoginAt,
          isActive: payerPortalCredentials.isActive,
          createdAt: payerPortalCredentials.createdAt,
          updatedAt: payerPortalCredentials.updatedAt
        })
        .from(payerPortalCredentials)
        .where(and(
          eq(payerPortalCredentials.payerId, payerData.id),
          eq(payerPortalCredentials.organizationId, memberData.organizationId)
        ))
      );

      // Get total claims count
      const { data: claimList } = await safeSelect(async () =>
        db.select({ id: claims.id })
        .from(claims)
        .where(and(
          eq(claims.payerId, payerData.id),
          eq(claims.organizationId, memberData.organizationId)
        ))
      );

      // Get prior auth stats for approval rate calculation
      const { data: priorAuthStats } = await safeSelect(async () =>
        db.select({
          status: priorAuths.status,
          createdAt: priorAuths.createdAt
        })
        .from(priorAuths)
        .where(and(
          eq(priorAuths.payerId, payerData.id),
          eq(priorAuths.organizationId, memberData.organizationId)
        ))
      );

      // Calculate approval rate
      const totalPriorAuths = priorAuthStats?.length || 0;
      const approvedPriorAuths = priorAuthStats?.filter((pa: any) => pa.status === 'approved').length || 0;
      const approvalRate = totalPriorAuths > 0 ? (approvedPriorAuths / totalPriorAuths) * 100 : 0;

      // Average response time simplified (would need additional schema fields)
      const avgResponseTimeDays = 0;

      // Get last submission date
      const { data: lastSubmission } = await safeSingle(async () =>
        db.select({ submissionDate: claims.submissionDate })
        .from(claims)
        .where(and(
          eq(claims.payerId, payerData.id),
          eq(claims.organizationId, memberData.organizationId)
        ))
        .orderBy(desc(claims.submissionDate))
        .limit(1)
      );

      payersWithConfig.push({
        payer: {
          id: payerData.id,
          name: payerData.name,
          external_payer_id: '', // Not in current schema
          payer_type: 'general', // Not in current schema
          team_id: memberData.organizationId,
          created_at: payerData.createdAt,
          updated_at: payerData.updatedAt
        },
        config: config as any || undefined,
        portal_credential: portalCredential as any || undefined,
        submission_config: undefined, // Not implemented in current schema
        performance_stats: {
          total_claims: claimList?.length || 0,
          approval_rate: Math.round(approvalRate * 10) / 10,
          avg_response_time_days: avgResponseTimeDays,
          last_submission: (lastSubmission as any)?.submissionDate || payerData.updatedAt || payerData.createdAt || ''
        }
      });
    }

    return NextResponse.json({
      payers: payersWithConfig,
      include_popular: includePopular
    });

  } catch (error) {
    console.error('Payers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new payer
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body: CreatePayerRequest = await request.json();

    // Validate request body
    const { name } = body;

    if (!name) {
      return NextResponse.json({
        error: 'Missing required field: name'
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

    // Check if payer with same name already exists for this organization
    const { data: existingPayer } = await safeSingle(async () =>
      db.select({ id: payers.id })
      .from(payers)
      .innerJoin(payerContracts, eq(payers.id, payerContracts.payerId))
      .where(and(
        eq(payers.name, name),
        eq(payerContracts.organizationId, memberData.organizationId)
      ))
    );

    if (existingPayer) {
      return NextResponse.json({
        error: 'Payer with this name already exists for this organization'
      }, { status: 409 });
    }

    // Create payer
    const { data: newPayer, error: payerError } = await safeInsert(async () =>
      db.insert(payers)
        .values({ name })
        .returning({
          id: payers.id,
          name: payers.name,
          createdAt: payers.createdAt,
          updatedAt: payers.updatedAt
        })
    );

    if (payerError || !newPayer || newPayer.length === 0) {
      console.error('Error creating payer:', payerError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Create payer contract to link it to the organization
    const { error: contractError } = await safeInsert(async () =>
      db.insert(payerContracts)
        .values({
          payerId: (newPayer[0] as any).id,
          organizationId: memberData.organizationId
        })
    );

    if (contractError) {
      console.error('Error creating payer contract:', contractError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      payer: (newPayer[0] as any)
    }, { status: 201 });

  } catch (error) {
    console.error('Payer POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

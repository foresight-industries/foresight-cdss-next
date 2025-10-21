import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { teamMembers, payers, payerContracts, payerPortalCredentials, claims, priorAuths } from '@foresight-cdss-next/db';

// GET - Get specific payer with all configurations
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

    // Verify user has access to this payer through organization
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

    // Get payer through contract verification
    const { data: payerData, error: payerError } = await safeSingle(async () =>
      db.select({
        id: payers.id,
        name: payers.name,
        createdAt: payers.createdAt,
        updatedAt: payers.updatedAt
      })
      .from(payers)
      .innerJoin(payerContracts, eq(payers.id, payerContracts.payerId))
      .where(and(
        eq(payers.id, payerId),
        eq(payerContracts.organizationId, memberData.organizationId)
      ))
    );

    if (payerError || !payerData) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Get portal credentials
    const { data: portalCredential } = await safeSingle(async () =>
      db.select({
        id: payerPortalCredentials.id,
        portalName: payerPortalCredentials.portalName,
        portalUrl: payerPortalCredentials.portalUrl,
        portalType: payerPortalCredentials.portalType,
        username: payerPortalCredentials.username,
        lastLoginAt: payerPortalCredentials.lastLoginAt,
        isActive: payerPortalCredentials.isActive,
        createdAt: payerPortalCredentials.createdAt,
        updatedAt: payerPortalCredentials.updatedAt
      })
      .from(payerPortalCredentials)
      .where(and(
        eq(payerPortalCredentials.payerId, payerId),
        eq(payerPortalCredentials.organizationId, memberData.organizationId)
      ))
    );

    // Get performance stats - claims
    const { data: claimStats } = await safeSelect(async () =>
      db.select({
        id: claims.id,
        status: claims.status,
        createdAt: claims.createdAt
      })
      .from(claims)
      .where(and(
        eq(claims.payerId, payerId),
        eq(claims.organizationId, memberData.organizationId)
      ))
    );

    // Get performance stats - prior auths (simplified for now due to schema)
    const { data: paStats } = await safeSelect(async () =>
      db.select({
        id: priorAuths.id,
        status: priorAuths.status,
        createdAt: priorAuths.createdAt
      })
      .from(priorAuths)
      .where(and(
        eq(priorAuths.payerId, payerId),
        eq(priorAuths.organizationId, memberData.organizationId)
      ))
    );

    const totalClaims = claimStats?.length || 0;
    const approvedPAs = paStats?.filter((pa: any) => pa.status === 'approved').length || 0;
    const totalPAs = paStats?.length || 0;
    const approvalRate = totalPAs > 0 ? Math.round((approvedPAs / totalPAs) * 100) : 0;

    // Calculate average response time (simplified since we don't have approved/denied dates)
    const avgResponseTime = 0; // Would need additional schema fields to calculate properly

    const allItems = [...(claimStats || []), ...(paStats || [])]
      .filter((item: any) => item.createdAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const lastSubmission = allItems.length > 0 ? (allItems[0] as any).createdAt : (payerData as any)?.createdAt;

    return NextResponse.json({
      payer: {
        ...payerData,
        payer_config: [],
        portal_credential: portalCredential || null,
        submission_config: null // This would need to be implemented based on the actual schema
      },
      performance_stats: {
        total_claims: totalClaims,
        approval_rate: approvalRate,
        avg_response_time_days: avgResponseTime,
        last_submission: lastSubmission
      }
    });

  } catch (error) {
    console.error('Payer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payer
export async function PUT(
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
    const body = await request.json();

    // Validate permissions
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

    // Verify payer belongs to user's organization through contract
    const { data: existingPayer } = await safeSingle(async () =>
      db.select({
        id: payers.id
      })
      .from(payers)
      .innerJoin(payerContracts, eq(payers.id, payerContracts.payerId))
      .where(and(
        eq(payers.id, payerId),
        eq(payerContracts.organizationId, memberData.organizationId)
      ))
    );

    if (!existingPayer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Validate update fields and map to schema
    const allowedFields = new Set(['name']);
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.has(key) && value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    // Update payer
    const { data: payer, error } = await safeUpdate(async () =>
      db.update(payers)
        .set(updates)
        .where(eq(payers.id, payerId))
        .returning({
          id: payers.id,
          name: payers.name,
          createdAt: payers.createdAt,
          updatedAt: payers.updatedAt
        })
    );

    if (error || !payer || payer.length === 0) {
      console.error('Error updating payer:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      payer: payer[0]
    });

  } catch (error) {
    console.error('Payer PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete payer
export async function DELETE(
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

    // Validate permissions
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

    // Check if payer has any active claims or prior auths
    const { data: activeClaims } = await safeSelect(async () =>
      db.select({ id: claims.id })
        .from(claims)
        .where(and(
          eq(claims.payerId, payerId),
          eq(claims.organizationId, memberData.organizationId),
          inArray(claims.status, ['submitted', 'needs_review'] as const)
        ))
        .limit(1)
    );

    if (activeClaims && activeClaims.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete payer with active claims. Please resolve all active claims first.'
      }, { status: 400 });
    }

    const { data: activePAs } = await safeSelect(async () =>
      db.select({ id: priorAuths.id })
        .from(priorAuths)
        .where(and(
          eq(priorAuths.payerId, payerId),
          eq(priorAuths.organizationId, memberData.organizationId),
          inArray(priorAuths.status, ['pending'] as const)
        ))
        .limit(1)
    );

    if (activePAs && activePAs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete payer with active prior authorizations. Please resolve all active PAs first.'
      }, { status: 400 });
    }

    // First verify payer belongs to user's organization through contract
    const { data: contractCheck } = await safeSingle(async () =>
      db.select({ id: payerContracts.id })
        .from(payerContracts)
        .where(and(
          eq(payerContracts.payerId, payerId),
          eq(payerContracts.organizationId, memberData.organizationId)
        ))
    );

    if (!contractCheck) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Delete the payer
    const { data: payer, error } = await safeDelete(async () =>
      db.delete(payers)
        .where(eq(payers.id, payerId))
        .returning({
          id: payers.id,
          name: payers.name
        })
    );

    if (error || !payer || payer.length === 0) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Payer deleted successfully',
      payer_id: payerId
    });

  } catch (error) {
    console.error('Payer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

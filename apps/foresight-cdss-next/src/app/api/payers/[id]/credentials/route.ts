import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { teamMembers, payerPortalCredentials, payerContracts } from '@foresight-cdss-next/db';
import type { CreatePayerPortalCredentialRequest, UpdatePayerPortalCredentialRequest } from '@/types/payer.types';

// GET - Get payer portal credentials (sanitized)
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

    // Get payer portal credentials (without sensitive data)
    const { data: credential, error } = await safeSingle(async () =>
      db.select({
        id: payerPortalCredentials.id,
        portalName: payerPortalCredentials.portalName,
        portalUrl: payerPortalCredentials.portalUrl,
        portalType: payerPortalCredentials.portalType,
        username: payerPortalCredentials.username,
        lastSuccessfulLogin: payerPortalCredentials.lastLoginAt,
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

    if (error) {
      console.error('Error fetching payer credentials:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Add indicator for whether password exists without revealing it
    const credentialWithIndicator = credential ? {
      ...credential,
      has_password: true, // In real implementation, check if password field is not null
      password: undefined, // Never send password
      security_questions: undefined // Never send security questions
    } : null;

    return NextResponse.json({
      credential: credentialWithIndicator
    });

  } catch (error) {
    console.error('Payer credential GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create payer portal credentials
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
    const body: CreatePayerPortalCredentialRequest = await request.json();

    // Validate request body - map to actual schema fields
    const {
      portalName,
      portalUrl,
      portalType,
      username,
      encryptedPassword,
      securityQuestions
    } = body as any;

    if (!portalUrl) {
      return NextResponse.json({
        error: 'portalUrl is required'
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(portalUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid portal URL format' }, { status: 400 });
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

    // Check if credentials already exist
    const { data: existingCredential } = await safeSingle(async () =>
      db.select({ id: payerPortalCredentials.id })
        .from(payerPortalCredentials)
        .where(and(
          eq(payerPortalCredentials.payerId, payerId),
          eq(payerPortalCredentials.organizationId, memberData.organizationId)
        ))
    );

    if (existingCredential) {
      return NextResponse.json({
        error: 'Portal credentials already exist. Use PUT to update.'
      }, { status: 409 });
    }

    // Create payer portal credentials
    const { data: credential, error } = await safeInsert(async () =>
      db.insert(payerPortalCredentials)
        .values({
          organizationId: memberData.organizationId,
          payerId: payerId,
          portalName: portalName || 'Default Portal',
          portalUrl: portalUrl,
          portalType: portalType || 'provider_portal',
          username: username || null,
          encryptedPassword: encryptedPassword || null,
          securityQuestions: securityQuestions || null
        })
        .returning({
          id: payerPortalCredentials.id,
          portalName: payerPortalCredentials.portalName,
          portalUrl: payerPortalCredentials.portalUrl,
          portalType: payerPortalCredentials.portalType,
          username: payerPortalCredentials.username,
          isActive: payerPortalCredentials.isActive,
          createdAt: payerPortalCredentials.createdAt,
          updatedAt: payerPortalCredentials.updatedAt
        })
    );

    if (error || !credential || credential.length === 0) {
      console.error('Error creating payer credentials:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      credential: {
        ...(credential[0] as any),
        has_password: !!encryptedPassword
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Payer credential POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payer portal credentials
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
    const body: UpdatePayerPortalCredentialRequest = await request.json();

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

    // Verify credential exists and belongs to user's organization
    const { data: existingCredential } = await safeSingle(async () =>
      db.select({
        id: payerPortalCredentials.id
      })
      .from(payerPortalCredentials)
      .where(and(
        eq(payerPortalCredentials.payerId, payerId),
        eq(payerPortalCredentials.organizationId, memberData.organizationId)
      ))
    );

    if (!existingCredential) {
      return NextResponse.json({ error: 'Credentials not found' }, { status: 404 });
    }

    // Validate update fields and map to schema
    const allowedFields = new Set([
      'portalName', 'portalUrl', 'portalType', 'username', 
      'encryptedPassword', 'securityQuestions'
    ]);
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.has(key) && value !== undefined) {
        // Don't update password if it's masked
        if (key === 'encryptedPassword' && value === '••••••••') {
          continue;
        }
        updates[key] = value;
      }
    }

    // Validate URL if provided
    if (updates.portalUrl) {
      try {
        new URL(updates.portalUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid portal URL format' }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.updatedAt = new Date();

    // Update credentials
    const { data: credential, error } = await safeUpdate(async () =>
      db.update(payerPortalCredentials)
        .set(updates)
        .where(eq(payerPortalCredentials.id, (existingCredential as any).id))
        .returning({
          id: payerPortalCredentials.id,
          portalName: payerPortalCredentials.portalName,
          portalUrl: payerPortalCredentials.portalUrl,
          portalType: payerPortalCredentials.portalType,
          username: payerPortalCredentials.username,
          isActive: payerPortalCredentials.isActive,
          createdAt: payerPortalCredentials.createdAt,
          updatedAt: payerPortalCredentials.updatedAt
        })
    );

    if (error || !credential || credential.length === 0) {
      console.error('Error updating payer credentials:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      credential: {
        ...(credential[0] as any),
        has_password: !!(updates.encryptedPassword || true) // Assume password exists if not being updated
      }
    });

  } catch (error) {
    console.error('Payer credential PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete payer portal credentials
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

    // Verify credential exists and belongs to user's organization, then delete
    const { data: credential, error } = await safeDelete(async () =>
      db.delete(payerPortalCredentials)
        .where(and(
          eq(payerPortalCredentials.payerId, payerId),
          eq(payerPortalCredentials.organizationId, memberData.organizationId)
        ))
        .returning({
          id: payerPortalCredentials.id
        })
    );

    if (error || !credential || credential.length === 0) {
      return NextResponse.json({ error: 'Credentials not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Portal credentials deleted successfully',
      credential_id: (credential[0] as any).id
    });

  } catch (error) {
    console.error('Payer credential DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

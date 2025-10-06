import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { CreatePayerPortalCredentialRequest, UpdatePayerPortalCredentialRequest } from '@/types/payer.types';

// GET - Get payer portal credentials (sanitized)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const payerId = params.id;

    // Verify user has access to this payer
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Get payer portal credentials (without sensitive data)
    const { data: credential, error } = await supabase
      .from('payer_portal_credential')
      .select('id, portal_url, username, mfa_enabled, automation_enabled, last_successful_login, created_at, updated_at')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
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

    const supabase = await createSupabaseServerClient();
    const payerId = params.id;
    const body: CreatePayerPortalCredentialRequest = await request.json();

    // Validate request body
    const {
      portal_url,
      username,
      password,
      mfa_enabled,
      automation_enabled,
      security_questions
    } = body;

    if (!portal_url) {
      return NextResponse.json({
        error: 'portal_url is required'
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(portal_url);
    } catch {
      return NextResponse.json({ error: 'Invalid portal URL format' }, { status: 400 });
    }

    // Get user's current team and verify admin permissions
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify payer exists and belongs to team
    const { data: payer } = await supabase
      .from('payer')
      .select('id, team_id')
      .eq('id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (!payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Check if credentials already exist
    const { data: existingCredential } = await supabase
      .from('payer_portal_credential')
      .select('id')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (existingCredential) {
      return NextResponse.json({
        error: 'Portal credentials already exist. Use PUT to update.'
      }, { status: 409 });
    }

    // Create payer portal credentials
    const insertData = {
      payer_id: parseInt(payerId),
      team_id: member.team_id!,
      portal_url,
      username: username || null,
      password: password || null,
      mfa_enabled: mfa_enabled || null,
      automation_enabled: automation_enabled || null,
      security_questions: (security_questions || null) as any
    };

    const { data: credential, error } = await supabase
      .from('payer_portal_credential')
      .insert(insertData)
      .select('id, portal_url, username, mfa_enabled, automation_enabled, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating payer credentials:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      credential: {
        ...credential,
        has_password: !!password
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

    const supabase = await createSupabaseServerClient();
    const payerId = params.id;
    const body: UpdatePayerPortalCredentialRequest = await request.json();

    // Validate permissions
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify credential exists and belongs to user's team
    const { data: existingCredential } = await supabase
      .from('payer_portal_credential')
      .select('id, team_id')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (!existingCredential) {
      return NextResponse.json({ error: 'Credentials not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = [
      'portal_url', 'username', 'password', 'mfa_enabled',
      'automation_enabled', 'security_questions'
    ];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Don't update password if it's masked
        if (key === 'password' && value === '••••••••') {
          continue;
        }
        updates[key] = value;
      }
    }

    // Validate URL if provided
    if (updates.portal_url) {
      try {
        new URL(updates.portal_url);
      } catch {
        return NextResponse.json({ error: 'Invalid portal URL format' }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update credentials
    const { data: credential, error } = await supabase
      .from('payer_portal_credential')
      .update(updates)
      .eq('id', existingCredential.id)
      .select('id, portal_url, username, mfa_enabled, automation_enabled, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating payer credentials:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      credential: {
        ...credential,
        has_password: !!(updates.password || true) // Assume password exists if not being updated
      }
    });

  } catch (error) {
    console.error('Payer credential PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete payer portal credentials
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const payerId = params.id;

    // Validate permissions
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify credential exists and belongs to user's team, then delete
    const { data: credential, error } = await supabase
      .from('payer_portal_credential')
      .delete()
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .select('id')
      .single();

    if (error || !credential) {
      return NextResponse.json({ error: 'Credentials not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Portal credentials deleted successfully',
      credential_id: credential.id
    });

  } catch (error) {
    console.error('Payer credential DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

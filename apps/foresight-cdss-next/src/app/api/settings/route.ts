import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireTeamMembership } from '@/lib/team';

export async function GET(req: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const supabase = await createSupabaseServerClient();

    // Get all settings for the team
    const { data: settings, error } = await supabase
      .from('team_settings')
      .select('key, value')
      .eq('team_id', membership.team_id);

    if (error) {
      console.error('Error fetching team settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Convert array of settings to object
    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Upsert the setting
    const { data, error } = await supabase
      .from('team_settings')
      .upsert({
        team_id: membership.team_id,
        key,
        value: value as any,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'team_id,key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving team setting:', error);
      return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }

    return NextResponse.json({ success: true, setting: data });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const { settings } = await req.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Convert settings object to array of upsert operations
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      team_id: membership.team_id,
      key,
      value: value as any,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('team_settings')
      .upsert(settingsArray, {
        onConflict: 'team_id,key'
      })
      .select();

    if (error) {
      console.error('Error saving team settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (error) {
    console.error('Settings bulk save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

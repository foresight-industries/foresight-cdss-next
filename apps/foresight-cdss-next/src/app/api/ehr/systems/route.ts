import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET - List available EHR systems
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Get all available EHR systems
    const { data: ehrSystems, error } = await supabase
      .from('ehr_system')
      .select('*')
      .order('display_name');

    if (error) {
      console.error('Error fetching EHR systems:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      ehr_systems: ehrSystems || []
    });

  } catch (error) {
    console.error('EHR systems GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

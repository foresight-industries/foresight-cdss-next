import { getPharmacyInfo } from '../../_utils/getPharmacyInfo';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';
import { NextResponse } from "next/server";

/**
 * @description fetches patient in dosespot format
 */

export default async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dosespotPharmacyId } = await params;

  if (!dosespotPharmacyId) {
    throw new Error(`Dosespot pharmacy id was not provided`);
  }

  try {
    const supabase = createServerSupabaseClient<Database>({ req, res });

    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
    return NextResponse.json(
      {
        message: 'not_authenticated',
        description:
          'The user does not have an active session or is not authenticated',
        error: new Error(' Not Authorized'),
      },
      { status: 401 }
    );

    const dosespotProviderId = await supabase
      .from('clinician')
      .select('dosespot_provider_id')
      .eq('profile_id', session.user.id)
      .throwOnError()
      .maybeSingle()
      .then(({ data }) => data?.dosespot_provider_id);

    if (!dosespotProviderId) {
      throw new Error(`Unauthorized`);
    }
    //need to add get patient demographics endpoint
    const { data: token } = await createDosespotToken(dosespotProviderId);

    if (!token) {
      throw new Error(`Could not generate token to get patient demographics`);
    }

    const pharmacy = await getPharmacyInfo(
      dosespotPharmacyId,
      token.access_token
    );

    return NextResponse.json(pharmacy, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: err },
      { status: 422 }
    );
  }
}

import { getPharmacyInfo } from '../../_utils/getPharmacyInfo';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    const supabase = await createSupabaseServerClient();

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

    const { data: dosespotProviderId, error: dosespotProviderIdError } =
      await supabase
        .from("clinician")
        .select("dosespot_provider_id")
        .eq("profile_id", session.user.id)
        .throwOnError()
        .maybeSingle();

    if (dosespotProviderIdError) {
      throw new Error(`Could not get dosespot provider ID`);
    }

    if (!dosespotProviderId) {
      throw new Error(`Unauthorized`);
    }
    //need to add get patient demographics endpoint
    const { data: token } = await createDosespotToken(
      dosespotProviderId.dosespot_provider_id ?? 0
    );

    if (!token) {
      throw new Error(`Could not generate token to get patient demographics`);
    }

    const pharmacy = await getPharmacyInfo(
      Number(dosespotPharmacyId),
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

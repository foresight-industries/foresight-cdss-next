import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../../../_utils/createDosespotToken';
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDosespotPatientUrl } from '@/app/api/utils/dosespot/getDosespotPatientUrl';
import { getDosespotHeaders } from '@/app/api/utils/dosespot/getDosespotHeaders';

type AddDosespotPrescriptionRequestBody = {
  dosespotPatientId: number;
  dosespotPharmacyId: number;
  isPrimary: boolean;
};

type AddPharmacyToPatientResult = {
  Result: {
    ResultCode: 'ERROR' | 'OK';
    ResultDescription: string;
  };
};

export default async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { dosespotPharmacyId, isPrimary = false } =
    await req.json() as AddDosespotPrescriptionRequestBody;
  const { id: dosespotPatientId } = await params;

  if (!dosespotPharmacyId) {
    throw new Error(`Dosespot pharmacy id was not provided`);
  }

  if (!dosespotPatientId) {
    throw new Error(`Dosespot patient id was not provided`);
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
          message: "not_authenticated",
          description:
            "The user does not have an active session or is not authenticated",
          error: new Error(" Not Authorized"),
        },
        { status: 401 }
      );

    const dosespotProviderId = await supabase
      .from("clinician")
      .select("dosespot_provider_id")
      .eq("profile_id", session.user.id)
      .throwOnError()
      .maybeSingle()
      .then(
        ({ data }: { data: { dosespot_provider_id: number | null } | null }) =>
          data?.dosespot_provider_id
      );

    if (!dosespotProviderId) {
      throw new Error(`Unauthorized`);
    }

    //create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: "POST",
      url: `${getDosespotPatientUrl()}/${dosespotPatientId}/pharmacies`,
      data: {
        SetAsPrimary: isPrimary,
        PharmacyId: dosespotPharmacyId,
      },
      headers: getDosespotHeaders(token.access_token),
    };

    const { data: pharmacy } = await axios<AddPharmacyToPatientResult>(options);

    if (pharmacy.Result.ResultCode === "ERROR") {
      throw new Error(
        pharmacy.Result.ResultDescription ||
          `Could not add Pharmacy to ${dosespotPharmacyId}`
      );
    }

    return NextResponse.json(
      pharmacy,
      {
        status: 200
      }
    );
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

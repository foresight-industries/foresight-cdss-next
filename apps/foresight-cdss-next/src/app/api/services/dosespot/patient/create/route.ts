import { NextRequest, NextResponse } from "next/server";
import { AxiosError, isAxiosError } from "axios";
import { createDosespotToken } from "@/app/api/services/dosespot/_utils/createDosespotToken";
import { createDosespotPatient } from "@/app/api/services/dosespot/_utils/createDosespotPatient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

type CreateDosespotPatientRequestBody = {
  patientId: number;
};

export default async function DosespotCreatePatientHandler(
  req: NextRequest,
) {
  const { patientId } = await req.json() as CreateDosespotPatientRequestBody;

  try {
    if (!patientId) {
      throw new Error(`Zealthy patient id is required`);
    }

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

    const [dosespotProviderId, patient] = await Promise.all([
      supabase
        .from("clinician")
        .select("id, npi_key, dosespot_provider_id")
        .eq("profile_id", session.user.id)
        .throwOnError()
        .maybeSingle()
        .then(
          ({
            data,
          }: {
            data: {
              id: number;
              npi_key: string | null;
              dosespot_provider_id: number | null;
            } | null;
          }) => data?.dosespot_provider_id ?? 0
        ),
      supabase
        .from("patient")
        .select("*")
        .eq("id", patientId)
        .single()
        .then(({ data }: { data: Tables<"patient"> | null }) => data),
    ]);

    if (!dosespotProviderId) {
      throw new Error(`Unauthorized`);
    }

    if (!patient) {
      throw new Error(`Could not find patient for patient id: ${patientId}`);
    }

    if (patient.dosespot_patient_id) {
      console.log({
        level: 'info',
        message: `Patient ${patientId} already has dosespot id. Returning...`,
      });

      return NextResponse.json(
        {
          id: patient.id,
          dosespot_patient_id: patient.dosespot_patient_id,
        },
        { status: 200 }
      );
    }

    //create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const zealthyPatient = await createDosespotPatient(
      patient,
      token.access_token
    );

    return NextResponse.json(
      zealthyPatient,
      { status: 200 }
    );
  } catch (err) {
    let message = (err as Error).message;
    if (isAxiosError(err)) {
      message = JSON.stringify((err as AxiosError).response?.data);
    }
    console.log({
      ERROR: message,
    });

    return NextResponse.json(
      { message },
      { status: 400 }
    );
  }
}

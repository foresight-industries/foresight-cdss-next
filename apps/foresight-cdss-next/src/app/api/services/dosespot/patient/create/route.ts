import { NextRequest, NextResponse } from "next/server";
import { AxiosError, isAxiosError } from 'axios';
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';
import { Database } from '@/lib/database.types';
import { createDosespotPatient } from '@/app/api/services/dosespot/_utils/createDosespotPatient';
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const [dosespotProviderId, patient] = await Promise.all([
      supabase
        .from('clinician')
        .select('dosespot_provider_id')
        .eq('profile_id', session.user.id)
        .throwOnError()
        .maybeSingle()
        .then(({ data }) => data?.dosespot_provider_id),
      supabase
        .from('patient')
        .select('*')
        .eq('id', patientId)
        .throwOnError()
        .maybeSingle()
        .then(({ data }) => data),
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

      res.status(200).json({
        id: patient.id,
        dosespot_patient_id: patient.dosespot_patient_id,
      });

      return;
    }

    //create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const zealthyPatient = await createDosespotPatient(
      patient,
      supabase,
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

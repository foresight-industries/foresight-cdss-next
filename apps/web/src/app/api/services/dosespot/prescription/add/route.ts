import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type AddDosespotPrescriptionRequestBody = {
  dosespot_patient_id: number;
  dosespot_provider_id: number;
  [key: string]: any; // For additional prescription data
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AddDosespotPrescriptionRequestBody;
    const { dosespot_provider_id, dosespot_patient_id, ...data } = body;

    if (!dosespot_provider_id) {
      return Response.json(
        { message: 'dosespot_provider_id is required' },
        { status: 400 }
      );
    }

    if (!dosespot_patient_id) {
      return Response.json(
        { message: 'dosespot_patient_id is required' },
        { status: 400 }
      );
    }

    console.log({
      dosespot_patient_id,
      data,
    });

    // Create token
    const { data: token } = await createDosespotToken(dosespot_provider_id);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/coded`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data,
    };

    // Add prescription
    const { data: prescription } = await axios(options);

    if (prescription.Result.ResultCode === 'ERROR') {
      throw new Error(
        prescription.Result.ResultDescription ||
        `Could not create prescription for dosespot patient id: ${dosespot_patient_id}`
      );
    }

    console.log({ PRESCRIPTION: prescription });

    return Response.json(prescription);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

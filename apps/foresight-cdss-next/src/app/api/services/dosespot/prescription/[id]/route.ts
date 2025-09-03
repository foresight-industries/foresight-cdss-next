import { NextApiRequest } from 'next';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { NextResponse } from "next/server";

type CancelDosespotPrescriptionRequestBody = {
  dosespot_patient_id: number;
};

export async function DELETE(
  req: NextApiRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dosespot_patient_id } =
      req.body as CancelDosespotPrescriptionRequestBody;

    const { id: prescriptionId } = await params;

    const dosespotProviderId = Number(process.env.DOSESPOT_PROVIDER_ID);
    if (!dosespotProviderId) {
      throw new Error(`DOSESPOT_PROVIDER_ID is not set`);
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env
        .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/${prescriptionId}/cancel`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data: {},
    };

    // Search pharmacies
    const { data: prescription } = await axios(options);

    if (prescription.Result.ResultCode === 'ERROR') {
      throw new Error(
        prescription.Result.ResultDescription ||
        `Could not create prescription for dosespot patient id: ${dosespot_patient_id}`
      );
    }

    console.log({ PRESCRIPTION: prescription });

    return NextResponse.json(prescription, { status: 200 })
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json({ message: (err as Error)?.message }, { status: 400 });
  }
}

type AddDosespotPrescriptionRequestBody = {
  dosespot_patient_id: number;
};

export async function PUT(
  req: NextApiRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      dosespot_patient_id,
      ...data
    } = req.body as AddDosespotPrescriptionRequestBody;

    const { id: dosespot_prescription_id } = await params;

    const dosespot_provider_id = Number(process.env.DOSESPOT_PROVIDER_ID);
    if (!dosespot_provider_id) {
      throw new Error(`DOSESPOT_PROVIDER_ID is not set`);
    }

    console.log({
      dosespot_patient_id,
      dosespot_prescription_id,
      data,
    });

    // Create token
    const { data: token } = await createDosespotToken(dosespot_provider_id);

    const options: AxiosRequestConfig = {
      method: 'PUT',
      url: `${process.env
        .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/coded/${dosespot_prescription_id}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data,
    };

    // Search pharmacies
    const { data: prescription } = await axios(options);

    if (prescription.Result.ResultCode === 'ERROR') {
      throw new Error(
        prescription.Result.ResultDescription ||
        `Could not create prescription for dosespot patient id: ${dosespot_patient_id}`
      );
    }

    console.log({ PRESCRIPTION: prescription });

    return NextResponse.json(
      prescription,
      { status: 200 }
    );
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}


import { NextApiRequest } from 'next';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { NextResponse } from "next/server";

type CancelDosespotPrescriptionRequestBody = {
  dosespot_patient_id: number;
  prescriptionId: number;
  dosespotProviderId: number;
};

export default async function DELETE(
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

    //create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env
        .DOSESPOT_BASE_URL!}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/${prescriptionId}/cancel`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data: {},
    };

    //search pharmacies
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

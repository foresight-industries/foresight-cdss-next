import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type AddDosespotPrescriptionRequestBody = {
  dosespot_patient_id: number;
  dosespot_provider_id: number;
};

export default async function POST(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { dosespot_provider_id, dosespot_patient_id, ...data } =
      req.body as AddDosespotPrescriptionRequestBody;

    console.log({
      dosespot_patient_id,
      data,
    });

    //create token
    const { data: token } = await createDosespotToken(dosespot_provider_id);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env
        .DOSESPOT_BASE_URL!}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/coded`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data,
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

    res.status(200).json(prescription);
  } catch (err) {
    console.log({ ERROR: err });
    res.status(400).json({ message: (err as Error)?.message });
  }
}

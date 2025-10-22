import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';
import {
  createDosespotToken,
  createProxyDosespotToken,
} from '../../_utils/createDosespotToken';
import { getPrescriptionInfo } from '../../_utils/getPrescriptionInfo';

type SendPrescriptionsRequestBody = {
  dosespotPatientId: number;
  prescriptionIds: number[];
  dosespotProviderId?: number;
  dosespotCoordinatorId?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendPrescriptionsRequestBody;
    const {
      dosespotProviderId,
      dosespotPatientId,
      prescriptionIds,
      dosespotCoordinatorId,
    } = body;

    if (!dosespotPatientId) {
      return Response.json(
        { message: 'dosespotPatientId is required' },
        { status: 400 }
      );
    }

    if (!prescriptionIds || prescriptionIds.length === 0) {
      return Response.json(
        { message: 'prescriptionIds array is required' },
        { status: 400 }
      );
    }

    // Handle coordinator flow (proxy token)
    if (dosespotCoordinatorId) {
      const { data: token } = await createDosespotToken(dosespotCoordinatorId);
      const prescriptionData = await getPrescriptionInfo(
        prescriptionIds[0],
        dosespotPatientId,
        token.access_token
      );
      const prescriber = prescriptionData.PrescriberId;

      console.log('LOGIN WITH PROXY, CLINICIAN ID IS ', prescriber);

      const providerToken = await createProxyDosespotToken(
        dosespotCoordinatorId,
        prescriber
      );

      const options: AxiosRequestConfig = {
        method: 'POST',
        url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions/send`,
        headers: {
          'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${providerToken.data.access_token}`,
        },
        data: { PrescriptionIds: prescriptionIds },
      };

      console.log(options);

      const { data: sentPrescription } = await axios(options);

      console.log({ SENT_PRESCRIPTION: sentPrescription[0].Result });

      return Response.json(sentPrescription);
    }
    // Handle provider flow (direct token)
    else {
      if (!dosespotProviderId) {
        return Response.json(
          { message: 'dosespotProviderId is required when dosespotCoordinatorId is not provided' },
          { status: 400 }
        );
      }

      const { data: token } = await createDosespotToken(dosespotProviderId);

      const options: AxiosRequestConfig = {
        method: 'POST',
        url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions/send`,
        headers: {
          'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token.access_token}`,
        },
        data: { PrescriptionIds: prescriptionIds },
      };

      console.log(options);

      const { data: sentPrescription } = await axios(options);

      console.log({ SENT_PRESCRIPTION: sentPrescription[0].Result });

      return Response.json(sentPrescription);
    }
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 422 });
  }
}

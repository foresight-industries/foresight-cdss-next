import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotResult } from '@/types/dosespot';
import { createDosespotToken } from '../_utils/createDosespotToken';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';

type ReconcileRxChangeRequestBody = {
  rxChangeRequestId: number;
  referencedPrescriptionId: number;
  dosespotProviderId: number;
  dosespotPatientId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReconcileRxChangeRequestBody;
    const {
      rxChangeRequestId,
      referencedPrescriptionId,
      dosespotProviderId,
      dosespotPatientId,
    } = body;

    if (!rxChangeRequestId) {
      return Response.json(
        { message: 'rxChangeRequestId is required' },
        { status: 400 }
      );
    }

    if (!referencedPrescriptionId) {
      return Response.json(
        { message: 'referencedPrescriptionId is required' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!dosespotPatientId) {
      return Response.json(
        { message: 'dosespotPatientId is required' },
        { status: 400 }
      );
    }

    console.log({ BODY: body });

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url:
        `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeRequestId}/patients/${dosespotPatientId}/reconcile`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        referencedPrescriptionId: referencedPrescriptionId,
      },
    };

    // Reconcile RX change
    const { data: result } = await axios<{ Result: DosespotResult }>(options);

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription || 'Something went wrong'
      );
    }

    return Response.json(result);
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 400 });
  }
}

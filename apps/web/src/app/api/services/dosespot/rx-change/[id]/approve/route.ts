import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotResult } from '@/types/dosespot';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

type ApproveRxChangeRequestBody = {
  selectedMedicationId: number;
  dosespotProviderId: number;
  originalPrescriptionId?: number;
  priorAuthCaseId?: number;
  newPatientId?: number;
  newPrescription?: any;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rxChangeRequestId = Number.parseInt(params.id);
    const body = await request.json() as ApproveRxChangeRequestBody;
    const {
      selectedMedicationId,
      dosespotProviderId,
      priorAuthCaseId,
      newPatientId,
      newPrescription,
    } = body;

    if (Number.isNaN(rxChangeRequestId)) {
      return Response.json(
        { message: 'Invalid RX change request ID' },
        { status: 400 }
      );
    }

    if (!selectedMedicationId) {
      return Response.json(
        { message: 'selectedMedicationId is required' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const requestData: any = {
      selectedMedicationId,
    };

    if (priorAuthCaseId) {
      requestData.PriorAuthNumber = priorAuthCaseId;
    }

    if (newPatientId) {
      requestData.NewPrescriptionPatientId = newPatientId;
    }

    if (newPrescription) {
      requestData.NewPrescription = newPrescription;
    }

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeRequestId}/approve`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: requestData,
    };

    // Approve RX change
    const { data: result } = await axios<{ Result: DosespotResult }>(options);

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription || 'Something went wrong'
      );
    }

    console.log({ RESULT: result });

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

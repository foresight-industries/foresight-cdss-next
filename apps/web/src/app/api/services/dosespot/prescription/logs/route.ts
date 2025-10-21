import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotPrescriptionLogsResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotPatientId = searchParams.get('dosespotPatientId');
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const dosespotPrescriptionId = searchParams.get('dosespotPrescriptionId');

    if (!dosespotPatientId) {
      return Response.json(
        { message: 'dosespotPatientId query parameter is required' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    if (!dosespotPrescriptionId) {
      return Response.json(
        { message: 'dosespotPrescriptionId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(parseInt(dosespotProviderId));

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions/${dosespotPrescriptionId}/log`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const { data: logs } = await axios<DosespotPrescriptionLogsResponse>(options);

    if (logs.Result.ResultCode === 'ERROR') {
      const details = `. Details: { Resource: PatientPrescriptionLogs, Patient: ${dosespotPatientId}, Prescription: ${dosespotPrescriptionId}`;
      throw new Error(logs.Result.ResultDescription + details);
    }

    return Response.json(logs.Items.reverse());
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosespotPatientId, dosespotProviderId, dosespotPrescriptionId } = body;

    if (!dosespotPatientId) {
      throw new Error('Dosespot patient id was not provided');
    }

    if (!dosespotProviderId) {
      throw new Error('Dosespot provider id was not provided');
    }

    if (!dosespotPrescriptionId) {
      throw new Error('Dosespot prescription id was not provided');
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions/${dosespotPrescriptionId}/log`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const { data: logs } = await axios<DosespotPrescriptionLogsResponse>(options);

    if (logs.Result.ResultCode === 'ERROR') {
      const details = `. Details: { Resource: PatientPrescriptionLogs, Patient: ${dosespotPatientId}}, Prescription:
  ${dosespotPrescriptionId}`;
      throw new Error(logs.Result.ResultDescription + details);
    }

    return Response.json(logs.Items.toReversed());
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 422 });
  }
}

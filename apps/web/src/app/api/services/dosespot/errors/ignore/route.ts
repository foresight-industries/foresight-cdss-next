import { NextRequest } from 'next/server';
import axios, { AxiosError, AxiosRequestConfig, isAxiosError } from 'axios';
import {
  DosespotResult,
  PrescriptionIgnoreError,
  PrescriptionIgnoreErrorsPayload,
} from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

const ignoreError = async (error: PrescriptionIgnoreError, token: string, comment?: string) => {
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${error.dosespotPatientId}/prescriptions/${error.dosespotPrescriptionId}/ignoreError`,
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      comment: comment || 'No longer needed',
    },
  };

  // Ignore prescription error
  const { data: result } = await axios<{ Result: DosespotResult }>(options);

  if (result.Result.ResultCode === 'ERROR') {
    const details = `. Details: {Resource: IgnorePrescriptionError, Patient: ${error.dosespotPatientId}, Prescription: ${error.dosespotPrescriptionId}}`;
    throw new Error(result.Result.ResultDescription + details);
  }

  return result;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors, dosespotProviderId, comment } = body as PrescriptionIgnoreErrorsPayload & { comment?: string };

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return Response.json(
        { message: 'errors array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate error objects
    for (const error of errors) {
      if (!error.dosespotPatientId || !error.dosespotPrescriptionId) {
        return Response.json(
          { message: 'Each error must have dosespotPatientId and dosespotPrescriptionId' },
          { status: 400 }
        );
      }
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const results = await Promise.all(
      errors.map(e => ignoreError(e, token.access_token, comment))
    );

    return Response.json({
      success: true,
      processed: results.length,
      results: results,
    });
  } catch (err) {
    let message = (err as Error).message;
    if (isAxiosError(err)) {
      message = JSON.stringify((err as AxiosError)?.response?.data);
    }

    console.log({ ERROR: message });
    return Response.json({ message }, { status: 422 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dosespotPatientId,
      dosespotPrescriptionId,
      dosespotProviderId,
      comment = 'No longer needed'
    } = body;

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

    if (!dosespotPrescriptionId) {
      return Response.json(
        { message: 'dosespotPrescriptionId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const singleError: PrescriptionIgnoreError = {
      dosespotPatientId,
      dosespotPrescriptionId,
    };

    const result = await ignoreError(singleError, token.access_token, comment);

    return Response.json({
      success: true,
      result: result,
    });
  } catch (err) {
    let message = (err as Error).message;
    if (isAxiosError(err)) {
      message = JSON.stringify((err as AxiosError)?.response?.data);
    }

    console.log({ ERROR: message });
    return Response.json({ message }, { status: 422 });
  }
}

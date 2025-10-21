import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import {
  DetailedDosespotTransmissionError,
  DosespotPrescriptionByIdResponse,
  DosespotTransmissionErrorResponse,
} from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';

const detailedError = async (
  error: DosespotTransmissionErrorResponse['Items'][0],
  token: string
) => {
  const prescriptionOptions = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url:
      `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${error.PatientId}/prescriptions/${error.PrescriptionId}`,
  };

  const { data: prescription } = await axios<DosespotPrescriptionByIdResponse>(prescriptionOptions);

  if (prescription.Result.ResultCode === 'ERROR') {
    const details = `Details: { Resource: PatientPrescriptionById, Patient: ${error.PatientId}, Prescription:
  ${error.PrescriptionId}}`;
    throw new Error(
      prescription.Result.ResultDescription + `. ${details}` ||
      `Something went wrong when tried to fetch patient prescription by Id. ${details}`
    );
  }

  return {
    ...error,
    Prescription: prescription.Prescription,
  } as DetailedDosespotTransmissionError;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const pageNumber = searchParams.get('pageNumber') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const errorType = searchParams.get('errorType'); // 'transmission', 'validation', 'network', etc.
    const severity = searchParams.get('severity'); // 'high', 'medium', 'low'

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(parseInt(dosespotProviderId));

    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber);
    queryParams.append('pageSize', pageSize);

    if (errorType) {
      queryParams.append('errorType', errorType);
    }

    if (severity) {
      queryParams.append('severity', severity);
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/notifications/errors?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get transmission errors
    const { data: errors } = await axios<DosespotTransmissionErrorResponse>(options);

    if (errors.Result.ResultCode === 'ERROR') {
      throw new Error(
        errors.Result.ResultDescription +
        `. Details: {Resource: TransmissionErrors, Provider: ${dosespotProviderId}}` ||
        `Something went wrong when requesting transmission errors from dosespot for ${dosespotProviderId}`
      );
    }

    // Filter errors to transmission-specific ones if needed
    const filteredErrors = errors.Items;

    // Optionally include detailed prescription information
    if (includeDetails) {
      const errorsDetails = await Promise.all(
        filteredErrors.map(async e => detailedError(e, token.access_token))
      );
      return Response.json({
        items: errorsDetails,
        pagination: errors.PageResult || null,
        total: errorsDetails.length,
        filters: {
          errorType,
          severity,
          includeDetails,
        },
      });
    }

    return Response.json({
      items: filteredErrors,
      pagination: errors.PageResult || null,
      total: filteredErrors.length,
      filters: {
        errorType,
        severity,
        includeDetails,
      },
    });
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dosespotProviderId,
      includeDetails = false,
      pageNumber = 1,
      pageSize = 50,
      errorType,
      severity,
      filters = {}
    } = body;

    if (!dosespotProviderId) {
      throw new Error(`Dosespot provider id was not provided`);
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber.toString());
    queryParams.append('pageSize', pageSize.toString());

    if (errorType) {
      queryParams.append('errorType', errorType);
    }

    if (severity) {
      queryParams.append('severity', severity);
    }

    // Apply additional filters from request
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/notifications/errors?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get transmission errors
    const { data: errors } = await axios<DosespotTransmissionErrorResponse>(options);

    if (errors.Result.ResultCode === 'ERROR') {
      throw new Error(
        errors.Result.ResultDescription +
        `. Details: {Resource: TransmissionErrors, Provider: ${dosespotProviderId}}` ||
        `Something went wrong when requesting transmission errors from dosespot for ${dosespotProviderId}`
      );
    }

    // Filter errors to transmission-specific ones if needed
    const filteredErrors = errors.Items;

    // Optionally include detailed prescription information
    if (includeDetails) {
      const errorsDetails = await Promise.all(
        filteredErrors.map(async e => detailedError(e, token.access_token))
      );
      return Response.json({
        items: errorsDetails,
        pagination: errors.PageResult || null,
        total: errorsDetails.length,
        filters: {
          errorType,
          severity,
          includeDetails,
          ...filters,
        },
      });
    }

    return Response.json({
      items: filteredErrors,
      pagination: errors.PageResult || null,
      total: filteredErrors.length,
      filters: {
        errorType,
        severity,
        includeDetails,
        ...filters,
      },
    });
  } catch (err) {
    const message = getErrorMessage(err);
    return Response.json({ message }, { status: 422 });
  }
}

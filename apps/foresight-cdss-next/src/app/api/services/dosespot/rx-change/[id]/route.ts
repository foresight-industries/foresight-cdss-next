import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import {
  DetailedDosespotRxRequest,
  DosespotRxRequest,
} from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getPrescriptionInfo } from '../../_utils/getPrescriptionInfo';

const detailedRxRequest = async (request: DosespotRxRequest, token: string) => {
  const prescriptionIds = [request.PrescribedPrescriptionId].concat(
    request.RequestedMedications
  );

  const prescriptions = await Promise.all(
    prescriptionIds.map(id =>
      getPrescriptionInfo(id, request.Patient.PatientId, token)
    )
  );

  return {
    ...request,
    RequestedMedications: prescriptions.filter((p: any) =>
      request.RequestedMedications.includes(p.PrescriptionId)
    ),
    PrescribedMedication: prescriptions.find(
      (p: any) => p.PrescriptionId === request.PrescribedPrescriptionId
    ),
  } as DetailedDosespotRxRequest;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rxChangeId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    if (!rxChangeId) {
      return Response.json(
        { message: 'RX change ID is required' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(parseInt(dosespotProviderId));

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'Error') {
      throw new Error(
        response.data.Result.ResultDescription ||
        `Could not get RX change request with ID: ${rxChangeId}`
      );
    }

    const rxRequest = response.data;

    // Optionally include detailed prescription information
    if (includeDetails && rxRequest) {
      const detailedRequest = await detailedRxRequest(rxRequest, token.access_token);
      return Response.json(detailedRequest);
    }

    return Response.json(rxRequest);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 422 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rxChangeId = params.id;
    const body = await request.json();
    const { dosespotProviderId, includeDetails = false } = body;

    if (!rxChangeId) {
      return Response.json(
        { message: 'RX change ID is required' },
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

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'Error') {
      throw new Error(
        response.data.Result.ResultDescription ||
        `Could not get RX change request with ID: ${rxChangeId}`
      );
    }

    const rxRequest = response.data;

    // Optionally include detailed prescription information
    if (includeDetails && rxRequest) {
      const detailedRequest = await detailedRxRequest(rxRequest, token.access_token);
      return Response.json(detailedRequest);
    }

    return Response.json(rxRequest);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 422 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rxChangeId = params.id;
    const body = await request.json();
    const { dosespotProviderId, ...updateData } = body;

    if (!rxChangeId) {
      return Response.json(
        { message: 'RX change ID is required' },
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

    const options: AxiosRequestConfig = {
      method: 'PUT',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: updateData,
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'Error') {
      throw new Error(
        response.data.Result.ResultDescription ||
        `Could not update RX change request with ID: ${rxChangeId}`
      );
    }

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

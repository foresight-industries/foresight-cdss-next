import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import {
  DetailedDosespotRxRequest,
  DosespotRxRequest,
  DosespotRxRequestsResponse,
} from '@/types/dosespot';
import { createDosespotToken } from '../_utils/createDosespotToken';
import { getPrescriptionInfo } from '../_utils/getPrescriptionInfo';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const status = searchParams.get('status') || 'pending';
    const includeDetails = searchParams.get('includeDetails') === 'true';

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
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${status}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios<DosespotRxRequestsResponse>(options);

    console.log({ REQUEST_RX: response });

    const { data: changes } = response;

    if (changes.Result.ResultCode === 'Error') {
      throw new Error(
        changes.Result.ResultDescription || 'Could not get RxChange requests'
      );
    }

    const requests = changes.Items;

    // Optionally include detailed prescription information
    if (includeDetails) {
      const detailedRequests = await Promise.all(
        requests.map(async request =>
          detailedRxRequest(request, token.access_token)
        )
      );
      return Response.json(detailedRequests);
    }

    return Response.json(requests);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosespotProviderId, status = 'pending', includeDetails = false } = body;

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
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${status}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios<DosespotRxRequestsResponse>(options);

    console.log({ REQUEST_RX: response });

    const { data: changes } = response;

    if (changes.Result.ResultCode === 'Error') {
      throw new Error(
        changes.Result.ResultDescription || 'Could not get RxChange requests'
      );
    }

    const requests = changes.Items;

    // Optionally include detailed prescription information
    if (includeDetails) {
      const detailedRequests = await Promise.all(
        requests.map(async request =>
          detailedRxRequest(request, token.access_token)
        )
      );
      return Response.json(detailedRequests);
    }

    return Response.json(requests);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../_utils/createDosespotToken';

type GetPriorAuthsRequestBody = {
  providerId: number;
  patientId?: number;
  status?: string[];
  pageNumber?: number;
  pageSize?: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status')?.split(',');
    const pageNumber = searchParams.get('pageNumber') || '1';
    const pageSize = searchParams.get('pageSize') || '50';

    if (!providerId) {
      return Response.json(
        { message: 'providerId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber);
    queryParams.append('pageSize', pageSize);

    if (patientId) {
      queryParams.append('patientId', patientId);
    }

    if (status && status.length > 0) {
      status.forEach(s => queryParams.append('status', s));
    }

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths?${queryParams}`;

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'ERROR') {
      throw new Error(
        response.data.Result.ResultDescription ||
        'Failed to retrieve prior authorizations'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GetPriorAuthsRequestBody;
    const {
      providerId,
      patientId,
      status,
      pageNumber = 1,
      pageSize = 50
    } = body;

    if (!providerId) {
      return Response.json(
        { message: 'providerId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber.toString());
    queryParams.append('pageSize', pageSize.toString());

    if (patientId) {
      queryParams.append('patientId', patientId.toString());
    }

    if (status && status.length > 0) {
      status.forEach(s => queryParams.append('status', s));
    }

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths?${queryParams}`;

    const options: AxiosRequestConfig = {
      method: 'GET', // Note: This is still a GET request to DoseSpot API
      url: url,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    if (response.data.Result?.ResultCode === 'ERROR') {
      throw new Error(
        response.data.Result.ResultDescription ||
        'Failed to retrieve prior authorizations'
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

import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/app/api/utils/getErrorMessage';
import { createDosespotToken } from '../../_utils/createDosespotToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const name = searchParams.get('name');
    const drugStatus = searchParams.get('drugStatus');

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(dosespotProviderId));

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    if (drugStatus) queryParams.append('drugStatus', drugStatus);

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/medications/search?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Search medications
    const { data: medications } = await axios(options);

    return Response.json(medications.Items);
  } catch (err) {
    const message = getErrorMessage(err);
    console.log({ ERROR: message });
    return Response.json({ message }, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosespotProviderId, name, drugStatus } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(dosespotProviderId));

    // Build query parameters for DoseSpot API
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    if (drugStatus) queryParams.append('drugStatus', drugStatus);

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/medications/search?${queryParams}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Search medications
    const { data: medications } = await axios(options);

    return Response.json(medications.Items);
  } catch (err) {
    const message = getErrorMessage(err);
    console.log({ ERROR: message });
    return Response.json({ message }, { status: 422 });
  }
}

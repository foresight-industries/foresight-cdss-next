import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotIDPDisclaimerResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type DosespotIDPDisclaimerRequestBody = {
  dosespotProviderId: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');

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
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/idpDisclaimer`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get IDP disclaimer
    const response = await axios<DosespotIDPDisclaimerResponse>(options);

    console.log({ RESPONSE_IDP: response });

    return Response.json(response.data);
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotIDPDisclaimerRequestBody;
    const { dosespotProviderId } = body;

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
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/idpDisclaimer`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get IDP disclaimer
    const response = await axios<DosespotIDPDisclaimerResponse>(options);

    console.log({ RESPONSE_IDP: response });

    return Response.json(response.data);
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

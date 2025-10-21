import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotLegalAgreementsResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type DosespotLegalDocumentsRequestBody = {
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
    const { data: token } = await createDosespotToken(Number.parseInt(dosespotProviderId));

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/${dosespotProviderId}/legalAgreements`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get legal agreements
    const response = await axios<DosespotLegalAgreementsResponse>(options);
    const { data: agreements } = response;

    console.log({ AGREEMENT1: JSON.stringify(agreements.Items[0]) });
    console.log({ AGREEMENT2: JSON.stringify(agreements.Items[1]) });
    console.log({ AGREEMENT3: JSON.stringify(agreements.Items[2]) });

    if (agreements.Result.ResultCode === 'ERROR') {
      throw new Error(
        agreements.Result.ResultDescription ||
        `Could not get legal agreements for provider: ${dosespotProviderId}`
      );
    }

    return Response.json(agreements);
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotLegalDocumentsRequestBody;
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
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/${dosespotProviderId}/legalAgreements`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get legal agreements
    const response = await axios<DosespotLegalAgreementsResponse>(options);
    const { data: agreements } = response;

    console.log({ AGREEMENT1: JSON.stringify(agreements.Items[0]) });
    console.log({ AGREEMENT2: JSON.stringify(agreements.Items[1]) });
    console.log({ AGREEMENT3: JSON.stringify(agreements.Items[2]) });

    if (agreements.Result.ResultCode === 'ERROR') {
      throw new Error(
        agreements.Result.ResultDescription ||
        `Could not get legal agreements for provider: ${dosespotProviderId}`
      );
    }

    return Response.json(agreements);
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotIDPInitializeResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type DosespotSubmitOTPBody = {
  SessionID: string;
  MobileCode: string;
  dosespotProviderId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotSubmitOTPBody;
    const { dosespotProviderId, ...data } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!data.SessionID) {
      return Response.json(
        { message: 'SessionID is required' },
        { status: 400 }
      );
    }

    if (!data.MobileCode) {
      return Response.json(
        { message: 'MobileCode is required' },
        { status: 400 }
      );
    }

    console.log({ DATA: body });

    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL!}/webapi/v2/api/clinicians/idpOtp`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data,
    };

    const response = await axios<DosespotIDPInitializeResponse>(options);
    const { data: result } = response;

    console.log({ RESPONSE: response });

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription ||
        `Could not submit OTP for sessionId: ${data.SessionID} for provider: ${dosespotProviderId}`
      );
    }

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const sessionId = searchParams.get('SessionID');
    const mobileCode = searchParams.get('MobileCode');

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return Response.json(
        { message: 'SessionID is required' },
        { status: 400 }
      );
    }

    if (!mobileCode) {
      return Response.json(
        { message: 'MobileCode is required' },
        { status: 400 }
      );
    }

    const data = {
      SessionID: sessionId,
      MobileCode: mobileCode,
    };

    console.log({ DATA: { ...data, dosespotProviderId } });

    const { data: token } = await createDosespotToken(parseInt(dosespotProviderId));

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL!}/webapi/v2/api/clinicians/idpOtp`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data,
    };

    const response = await axios<DosespotIDPInitializeResponse>(options);
    const { data: result } = response;

    console.log({ RESPONSE: response });

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription ||
        `Could not submit OTP for sessionId: ${sessionId} for provider: ${dosespotProviderId}`
      );
    }

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

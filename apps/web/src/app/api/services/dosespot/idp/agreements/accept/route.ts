import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotAcceptAgreementResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

type DosespotAcceptAgreementRequestBody = {
  agreementId: number;
  signature: string;
  dosespotProviderId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotAcceptAgreementRequestBody;
    const { dosespotProviderId, agreementId, signature } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!agreementId) {
      return Response.json(
        { message: 'agreementId is required' },
        { status: 400 }
      );
    }

    if (!signature || signature.trim() === '') {
      return Response.json(
        { message: 'signature is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/acceptAgreement`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        AgreementId: agreementId,
        NameSigned: signature.trim(),
      },
    };

    // Accept legal agreement with signature
    const response = await axios<DosespotAcceptAgreementResponse>(options);
    const { data: agreement } = response;

    if (agreement.Result.ResultCode === 'ERROR') {
      throw new Error(
        agreement.Result.ResultDescription ||
        `Could not submit agreement for agreementId: ${agreementId} for provider: ${dosespotProviderId}`
      );
    }

    return Response.json(agreement);
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as DosespotAcceptAgreementRequestBody;
    const { dosespotProviderId, agreementId, signature } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!agreementId) {
      return Response.json(
        { message: 'agreementId is required' },
        { status: 400 }
      );
    }

    if (!signature || signature.trim() === '') {
      return Response.json(
        { message: 'signature is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/acceptAgreement`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        AgreementId: agreementId,
        NameSigned: signature.trim(),
      },
    };

    // Accept legal agreement with signature
    const response = await axios<DosespotAcceptAgreementResponse>(options);
    const { data: agreement } = response;

    if (agreement.Result.ResultCode === 'ERROR') {
      throw new Error(
        agreement.Result.ResultDescription ||
        `Could not submit agreement for agreementId: ${agreementId} for provider: ${dosespotProviderId}`
      );
    }

    return Response.json({
      success: true,
      message: 'Legal agreement accepted successfully',
      agreementId: agreementId,
      signature: signature.trim(),
      data: agreement,
    });
  } catch (err) {
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

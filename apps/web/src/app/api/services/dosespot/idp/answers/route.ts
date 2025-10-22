import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotIDPInitializeResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type DosespotIDPAnswersRequestBody = {
  SessionID: string;
  Answers: string[];
  dosespotProviderId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotIDPAnswersRequestBody;
    const { dosespotProviderId, SessionID, Answers } = body;

    console.log({ DATA: body });

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!SessionID || SessionID.trim() === '') {
      return Response.json(
        { message: 'SessionID is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!Answers || !Array.isArray(Answers) || Answers.length === 0) {
      return Response.json(
        { message: 'Answers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate that all answers are strings and not empty
    for (let i = 0; i < Answers.length; i++) {
      if (typeof Answers[i] !== 'string' || Answers[i].trim() === '') {
        return Response.json(
          { message: `Answer at index ${i} must be a non-empty string` },
          { status: 400 }
        );
      }
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const requestData = {
      SessionID: SessionID.trim(),
      Answers: Answers.map(answer => answer.trim()),
    };

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/idpAnswers`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: requestData,
    };

    const response = await axios<DosespotIDPInitializeResponse>(options);
    const { data: result } = response;

    console.log({ RESPONSE: response });

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription ||
        `Could not submit IDP answers for sessionId: ${SessionID} for provider: ${dosespotProviderId}`
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as DosespotIDPAnswersRequestBody;
    const { dosespotProviderId, SessionID, Answers } = body;

    console.log({ DATA: body });

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!SessionID || SessionID.trim() === '') {
      return Response.json(
        { message: 'SessionID is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!Answers || !Array.isArray(Answers) || Answers.length === 0) {
      return Response.json(
        { message: 'Answers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate that all answers are strings and not empty
    for (let i = 0; i < Answers.length; i++) {
      if (typeof Answers[i] !== 'string' || Answers[i].trim() === '') {
        return Response.json(
          { message: `Answer at index ${i} must be a non-empty string` },
          { status: 400 }
        );
      }
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const requestData = {
      SessionID: SessionID.trim(),
      Answers: Answers.map(answer => answer.trim()),
    };

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/idpAnswers`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: requestData,
    };

    const response = await axios<DosespotIDPInitializeResponse>(options);
    const { data: result } = response;

    console.log({ RESPONSE: response });

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription ||
        `Could not submit IDP answers for sessionId: ${SessionID} for provider: ${dosespotProviderId}`
      );
    }

    return Response.json({
      success: true,
      message: 'IDP answers submitted successfully',
      sessionId: SessionID.trim(),
      answersCount: Answers.length,
      data: result,
    });
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

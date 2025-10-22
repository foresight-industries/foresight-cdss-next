import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type RemovePriorAuthRequestBody = {
  providerId: number;
  caseId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RemovePriorAuthRequestBody;
    const { providerId, caseId } = body;

    if (!providerId) {
      return Response.json(
        { message: 'providerId is required' },
        { status: 400 }
      );
    }

    if (!caseId) {
      return Response.json(
        { message: 'caseId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/remove`;

    const priorAuthInfo = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
    };

    console.log(priorAuthInfo);

    const response = await axios(priorAuthInfo);

    console.log('Prior auth removed successfully:', response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const caseId = searchParams.get('caseId');

    if (!providerId) {
      return Response.json(
        { message: 'providerId query parameter is required' },
        { status: 400 }
      );
    }

    if (!caseId) {
      return Response.json(
        { message: 'caseId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/remove`;

    const priorAuthInfo = {
      method: 'POST', // Note: DoseSpot API uses POST for remove operation
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
    };

    console.log(priorAuthInfo);

    const response = await axios(priorAuthInfo);

    console.log('Prior auth removed successfully:', response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

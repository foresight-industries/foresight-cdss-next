import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type AppealPriorAuthRequestBody = {
  providerId: number;
  caseId: number;
  appealReason: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AppealPriorAuthRequestBody;
    const { providerId, caseId, appealReason } = body;

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

    if (!appealReason || appealReason.trim() === '') {
      return Response.json(
        { message: 'appealReason is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/appeal`;

    const priorAuthInfo = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
      data: { AppealReason: appealReason.trim() },
    };

    console.log(priorAuthInfo);

    const response = await axios(priorAuthInfo);

    console.log(response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

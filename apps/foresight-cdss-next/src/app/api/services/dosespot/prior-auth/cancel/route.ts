import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type CancelPriorAuthRequestBody = {
  providerId: number;
  caseId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CancelPriorAuthRequestBody;
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

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/cancel`;

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

    console.log('Prior auth cancelled successfully:', response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

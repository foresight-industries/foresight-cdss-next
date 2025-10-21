import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

type SubmitMultiselectAnswerRequestBody = {
  providerId: number;
  caseId: number;
  questionId: number;
  answerIds: (string | number)[]; // Array of choice IDs
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitMultiselectAnswerRequestBody;
    const { providerId, caseId, questionId, answerIds } = body;

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

    if (!questionId) {
      return Response.json(
        { message: 'questionId is required' },
        { status: 400 }
      );
    }

    if (!answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
      return Response.json(
        { message: 'answerIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/questions/${questionId}/answer`;

    const priorAuthInfo = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
      data: {
        PriorAuthorizationQuestionChoices: answerIds.map((id: any) => {
          return {
            PriorAuthorizationQuestionChoiceId: Number(id),
          };
        }),
      },
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

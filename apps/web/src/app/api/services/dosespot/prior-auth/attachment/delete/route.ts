import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

type DeleteAttachmentRequestBody = {
  providerId: number;
  caseId: number;
  attachmentId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DeleteAttachmentRequestBody;
    const { providerId, caseId, attachmentId } = body;

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

    if (!attachmentId) {
      return Response.json(
        { message: 'attachmentId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/attachments/${attachmentId}`;

    const options = {
      url: url,
      method: 'DELETE',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY!,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    console.log('Attachment deleted successfully:', response.data);

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
    const attachmentId = searchParams.get('attachmentId');

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

    if (!attachmentId) {
      return Response.json(
        { message: 'attachmentId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(providerId));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/attachments/${attachmentId}`;

    const options = {
      url: url,
      method: 'DELETE',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY!,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await axios(options);

    console.log('Attachment deleted successfully:', response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

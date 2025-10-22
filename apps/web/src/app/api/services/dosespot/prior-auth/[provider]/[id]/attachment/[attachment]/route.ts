import { NextRequest } from 'next/server';
import { createDosespotToken } from '../../../../../_utils/createDosespotToken';
import { fileTypeFromBlob } from 'file-type';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string; id: string; attachment: string } }
) {
  try {
    const { provider, id, attachment } = params;

    if (!id) {
      return Response.json(
        { message: 'Prior auth ID is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!attachment) {
      return Response.json(
        { message: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}/attachments/${attachment}`;

    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY!,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Failed to fetch attachment: ${response.statusText}`);
    }

    const blob = await response.blob();
    const fileType = await fileTypeFromBlob(blob);

    const headers = new Headers();
    headers.set('Content-Type', fileType?.mime || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="attachment-${attachment}"`);

    return new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers
    });
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string; id: string; attachment: string } }
) {
  try {
    const { provider, id, attachment } = params;

    if (!id) {
      return Response.json(
        { message: 'Prior auth ID is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!attachment) {
      return Response.json(
        { message: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}/attachments/${attachment}`;

    const options = {
      method: 'DELETE',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY!,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Failed to delete attachment: ${response.statusText}`);
    }

    const result = await response.json();

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

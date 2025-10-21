import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const id = formData.get('id') as string;
    const provider = formData.get('provider') as string;
    const file = formData.get('file') as File;

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

    if (!file) {
      return Response.json(
        { message: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (optional - adjust as needed)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return Response.json(
        { message: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}/attachments`;

    // Create new FormData for DoseSpot API
    const dosespotFormData = new FormData();

    // Convert File to ArrayBuffer and then to Buffer for Node.js compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: file.type });

    dosespotFormData.append('file', blob, file.name);

    const response = await axios.post(url, dosespotFormData, {
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Attachment uploaded successfully:', response.data);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

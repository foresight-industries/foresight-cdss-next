import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';
import { fileTypeFromBlob } from 'file-type';
import { NextResponse } from "next/server";

export const runtime = 'edge';

export default async function GET(
  { params }: { params: Promise<{ id: string, attachment: string }> }
) {
  try {
    const { id, attachment } = await params;

    const provider = process.env.DOSESPOT_PROVIDER_ID;
    if (!provider) {
      throw new Error(`DOSESPOT_PROVIDER_ID is not set`);
    }

    if (!id) {
      throw new Error(`Dosespot PA ID is required`);
    }

    //create token
    const { data: token } = await createDosespotToken(Number(provider));
    const url = `${process.env
      .DOSESPOT_BASE_URL!}/webapi/v2/api/priorAuths/${id}/attachments/${attachment}`;
    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY!,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const response = await fetch(url, options);
    const blob = await response.blob();
    const fileType = await fileTypeFromBlob(blob);
    const headers = new Headers();
    headers.set('Content-Type', fileType?.mime ?? 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${attachment}"`
    )
    return NextResponse.json(
      blob,
      { status: 200, statusText: 'OK', headers }
    );
  } catch (err) {
    console.log({ ERROR: err });

    return NextResponse.json(
      { error: err },
      { status: 400 }
    );
  }
}

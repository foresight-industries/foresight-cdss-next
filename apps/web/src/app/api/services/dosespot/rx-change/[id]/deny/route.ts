import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotDenyReason, DosespotResult } from '@/types/dosespot';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

type DosespotDenyRXChangeRequestBody = {
  dosespotProviderId: number;
  reason: DosespotDenyReason;
  note?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rxChangeRequestId = parseInt(params.id);
    const body = await request.json() as DosespotDenyRXChangeRequestBody;
    const { dosespotProviderId, reason, note } = body;

    if (isNaN(rxChangeRequestId)) {
      return Response.json(
        { message: 'Invalid RX change request ID' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return Response.json(
        { message: 'reason is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/rxchanges/${rxChangeRequestId}/deny`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        Reason: reason,
        Comment: note || '',
      },
    };

    // Deny RX change
    const { data: result } = await axios<{ Result: DosespotResult }>(options);

    console.log({ DENY: result });

    if (result.Result.ResultCode === 'ERROR') {
      throw new Error(
        result.Result.ResultDescription || 'Something went wrong'
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

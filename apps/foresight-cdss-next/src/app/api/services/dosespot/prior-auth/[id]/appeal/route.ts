import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';

export default async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const { appealReason } = await req.json();

    const { data: token } = await createDosespotToken(Number(process.env.DOSESPOT_USER_ID));
    const url = `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${caseId}/appeal`;
    const priorAuthInfo = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      data: { AppealReason: appealReason },
    };

    console.log(priorAuthInfo);
    const response = await axios(priorAuthInfo);
    console.log(response.data);

    return NextResponse.json(
      response.data,
      { status: 200 }
    );
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

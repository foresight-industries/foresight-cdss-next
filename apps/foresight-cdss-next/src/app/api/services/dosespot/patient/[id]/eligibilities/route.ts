import { NextResponse } from "next/server";
import axios from 'axios';
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';

export default async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patient } = await params;

    if (!patient) {
      return NextResponse.json(
        { message: 'Dosespot Patient ID is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(
      Number(process.env.DOSESPOT_USER_ID)
    );
    console.log(token.access_token, 'PROXY TOKEN');
    console.log('USING COORDINATOR PROXY LOGIN!');

    const url = `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/eligibilities`;
    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url,
    };

    const response = await axios(options);

    return NextResponse.json(response.data, { status: 200 });
  } catch (err) {
    console.error({ ERROR: err });

    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../_utils/createDosespotToken';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    if (!patientId) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(
      Number(process.env.DOSESPOT_USER_ID)
    );

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patientId}/medications/history/consent`;

    const options = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      data: { patientId },
    };

    const response = await axios(options);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    if (!patientId) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(
      Number(process.env.DOSESPOT_USER_ID)
    );

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patientId}/medications/history/consent`;

    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
    };

    const response = await axios(options);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

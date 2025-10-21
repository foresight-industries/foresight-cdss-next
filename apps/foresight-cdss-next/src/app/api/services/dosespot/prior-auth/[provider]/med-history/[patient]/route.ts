import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../../_utils/createDosespotToken';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string; patient: string } }
) {
  try {
    const { provider, patient } = params;
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!patient) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    console.log({ provider, patient, page }, 'QUERY');

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/medications/history`;

    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      params: { pageNumber: page },
    };

    console.log(options);

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

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string; patient: string } }
) {
  try {
    const { provider, patient } = params;
    const body = await request.json();
    const { page = '1' } = body;

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!patient) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    console.log({ provider, patient, page }, 'POST REQUEST');

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/medications/history`;

    const options = {
      method: 'GET', // Note: This is still a GET request to DoseSpot API
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      params: { pageNumber: page },
    };

    console.log(options);

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

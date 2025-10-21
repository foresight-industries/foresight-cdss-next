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
    const coordinator = searchParams.get('coordinator');

    console.log({ provider, patient, coordinator }, 'QUERY FOR ELIGIBILITIES');

    if (!patient) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Create token - use coordinator proxy if specified, otherwise use provider
    const tokenProviderId = coordinator
      ? Number(process.env.DOSESPOT_USER_ID)
      : Number(provider);

    const { data: token } = await createDosespotToken(tokenProviderId);

    console.log(token.access_token, 'PROXY TOKEN');
    console.log(coordinator ? 'USING COORDINATOR PROXY LOGIN!' : '');

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/eligibilities`;

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

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string; patient: string } }
) {
  try {
    const { provider, patient } = params;
    const body = await request.json();
    const { coordinator } = body;

    console.log({ provider, patient, coordinator }, 'POST REQUEST FOR ELIGIBILITIES');

    if (!patient) {
      return Response.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Create token - use coordinator proxy if specified, otherwise use provider
    const tokenProviderId = coordinator
      ? Number(process.env.DOSESPOT_USER_ID)
      : Number(provider);

    const { data: token } = await createDosespotToken(tokenProviderId);

    console.log(token.access_token, 'PROXY TOKEN');
    console.log(coordinator ? 'USING COORDINATOR PROXY LOGIN!' : '');

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/eligibilities`;

    const options = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
      data: body,
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

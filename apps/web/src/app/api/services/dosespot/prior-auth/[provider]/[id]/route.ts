import { NextRequest } from 'next/server';
import { createDosespotToken } from '../../../_utils/createDosespotToken';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string; id: string } }
) {
  try {
    const { provider, id } = params;

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

    console.log('Getting prior auth with ID:', id);

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}`;

    const priorAuthInfo = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
    };

    const response = await axios(priorAuthInfo);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string; id: string } }
) {
  try {
    const { provider, id } = params;
    const body = await request.json();

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

    console.log('Updating prior auth with ID:', id);

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}`;

    const priorAuthInfo = {
      method: 'PUT',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      url: url,
      data: body,
    };

    const response = await axios(priorAuthInfo);

    return Response.json(response.data);
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
  { params }: { params: { provider: string; id: string } }
) {
  try {
    const { provider, id } = params;

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

    console.log('Deleting prior auth with ID:', id);

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/${id}`;

    const priorAuthInfo = {
      method: 'DELETE',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
    };

    const response = await axios(priorAuthInfo);

    return Response.json(response.data);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

import { NextRequest } from 'next/server';
import axios from 'axios';
import { createDosespotToken } from '../../../../_utils/createDosespotToken';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const searchParams = request.nextUrl.searchParams;
    const patient = searchParams.get('patient');
    const eligibility = searchParams.get('eligibility');
    const ndc = searchParams.get('ndc');

    if (!patient) {
      return Response.json(
        { message: 'patient query parameter is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    console.log({ provider, patient, eligibility, ndc }, 'QUERY');

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/formulary`;

    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      params: {
        patientEligibilityId: eligibility,
        nDC: ndc
      },
    };

    console.log('PATIENT FORMULARY: ', options);

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
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const body = await request.json();
    const { patient, eligibility, ndc } = body;

    if (!patient) {
      return Response.json(
        { message: 'patient is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return Response.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    console.log({ provider, patient, eligibility, ndc }, 'POST REQUEST');

    // Create token
    const { data: token } = await createDosespotToken(Number(provider));

    const url = `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/formulary`;

    const options = {
      method: 'GET', // Note: This is still a GET request to DoseSpot API
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      params: {
        patientEligibilityId: eligibility,
        nDC: ndc
      },
    };

    console.log('PATIENT FORMULARY: ', options);

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

import { NextRequest } from 'next/server';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getPatientDemographics } from '../../_utils/getPatientDemographics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dosespotPatientId = Number.parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');

    if (isNaN(dosespotPatientId)) {
      return Response.json(
        { message: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(parseInt(dosespotProviderId));

    if (!token) {
      throw new Error(`Could not generate token to get patient demographics`);
    }

    const patient = await getPatientDemographics(
      dosespotPatientId,
      token.access_token
    );

    return Response.json(patient);
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dosespotPatientId, dosespotProviderId } = body;

    // Use ID from URL params if not provided in body
    const patientId = dosespotPatientId || Number.parseInt(params.id);

    if (Number.isNaN(patientId)) {
      return Response.json(
        { message: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    if (!token) {
      throw new Error(`Could not generate token to get patient demographics`);
    }

    const patient = await getPatientDemographics(
      patientId,
      token.access_token
    );

    return Response.json(patient);
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

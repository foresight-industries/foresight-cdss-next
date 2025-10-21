import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');

    if (!prescriptionId) {
      return Response.json(
        { message: 'Prescription ID is required' },
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

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/prescriptions/${prescriptionId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const { data: prescription } = await axios(options);

    if (prescription.Result?.ResultCode === 'ERROR') {
      throw new Error(
        prescription.Result.ResultDescription ||
        `Could not retrieve prescription with id: ${prescriptionId}`
      );
    }

    return Response.json(prescription);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 422 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id;
    const body = await request.json();
    const { dosespot_provider_id, ...updateData } = body;

    if (!prescriptionId) {
      return Response.json(
        { message: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    if (!dosespot_provider_id) {
      return Response.json(
        { message: 'dosespot_provider_id is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespot_provider_id);

    const options: AxiosRequestConfig = {
      method: 'PUT',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/prescriptions/${prescriptionId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      data: updateData,
    };

    const { data: prescription } = await axios(options);

    if (prescription.Result?.ResultCode === 'ERROR') {
      throw new Error(
        prescription.Result.ResultDescription ||
        `Could not update prescription with id: ${prescriptionId}`
      );
    }

    return Response.json(prescription);
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
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');

    if (!prescriptionId) {
      return Response.json(
        { message: 'Prescription ID is required' },
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

    const options: AxiosRequestConfig = {
      method: 'DELETE',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/prescriptions/${prescriptionId}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    const { data: result } = await axios(options);

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import {
  DosespotPrescription,
  DosespotPrescriptionsResponse,
} from '@/types/dosespot';
import { createDosespotToken } from '../_utils/createDosespotToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const dosespotPatientId = searchParams.get('dosespotPatientId');
    const filterByStatus = searchParams.get('filterByStatus')?.split(',') || ['Entered', 'Edited'];

    if (!dosespotPatientId) {
      return Response.json(
        { message: 'dosespotPatientId query parameter is required' },
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

    let allPrescriptions: DosespotPrescription[] = [];
    let hasNext = false;
    let pageNumber = 1;

    do {
      const options: AxiosRequestConfig = {
        method: 'GET',
        url:
          `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions?pageNumber=${pageNumber}`,
        headers: {
          'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token.access_token}`,
        },
      };

      const { data: prescriptions } = await axios<DosespotPrescriptionsResponse>(options);

      if (prescriptions.Result.ResultCode === 'ERROR') {
        const details = `. Details: { Resource: PatientPrescriptions, PageNumber: ${pageNumber}, Patient:
  ${dosespotPatientId}}`;
        throw new Error(prescriptions.Result.ResultDescription + details);
      }

      allPrescriptions = allPrescriptions.concat(prescriptions.Items);
      hasNext = prescriptions.PageResult.HasNext;
      pageNumber = prescriptions.PageResult.CurrentPage + 1;
    } while (hasNext);

    if (filterByStatus[0] === 'All') {
      return Response.json(allPrescriptions);
    }

    return Response.json(
      allPrescriptions.filter(p => filterByStatus.includes(p.Status))
    );
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dosespotProviderId,
      dosespotPatientId,
      filterByStatus = ['Entered', 'Edited'],
    } = body as {
      dosespotPatientId: number;
      filterByStatus?: string[];
      dosespotProviderId: number;
    };

    if (!dosespotPatientId) {
      throw new Error(`Dosespot patient id was not provided`);
    }

    if (!dosespotProviderId) {
      throw new Error(`Dosespot provider id was not provided`);
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    let allPrescriptions: DosespotPrescription[] = [];
    let hasNext = false;
    let pageNumber = 1;

    do {
      const options: AxiosRequestConfig = {
        method: 'GET',
        url:
          `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/prescriptions?pageNumber=${pageNumber}`,
        headers: {
          'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token.access_token}`,
        },
      };

      const { data: prescriptions } = await axios<DosespotPrescriptionsResponse>(options);

      if (prescriptions.Result.ResultCode === 'ERROR') {
        const details = `. Details: { Resource: PatientPrescriptions, PageNumber: ${pageNumber}, Patient:
  ${dosespotPatientId}}`;
        throw new Error(prescriptions.Result.ResultDescription + details);
      }

      allPrescriptions = allPrescriptions.concat(prescriptions.Items);
      hasNext = prescriptions.PageResult.HasNext;
      pageNumber = prescriptions.PageResult.CurrentPage + 1;
    } while (hasNext);

    if (filterByStatus[0] === 'All') {
      return Response.json(allPrescriptions);
    }

    return Response.json(
      allPrescriptions.filter(p => filterByStatus.includes(p.Status))
    );
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

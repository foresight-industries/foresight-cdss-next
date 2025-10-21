import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotNotificationsResponse } from '@/types/dosespot';
import { createDosespotToken } from '../_utils/createDosespotToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number.parseInt(dosespotProviderId));

    console.log({ TOKEN: token });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/notifications/counts`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get notification counts
    const { data: notifications } = await axios<DosespotNotificationsResponse>(options);

    console.log({ NOTIFICATIONS: notifications });

    return Response.json([
      {
        name: 'Pending Prescriptions',
        value: notifications.PendingPrescriptionsCount,
        path: '/notifications/dosespot/pending-prescriptions',
      },
      {
        name: 'Transmission Errors',
        value: notifications.TransactionErrorsCount,
        path: '/notifications/dosespot/transmission-errors',
      },
      {
        name: 'RxChange Requests',
        value: notifications.PendingRxChangeCount,
        path: '/notifications/dosespot/rxchange-requests',
      },
    ]);
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosespotProviderId } = body;

    if (!dosespotProviderId) {
      throw new Error(`Dosespot provider id was not provided`);
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    console.log({ TOKEN: token });

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/notifications/counts`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    // Get notification counts
    const { data: notifications } = await axios<DosespotNotificationsResponse>(options);

    console.log({ NOTIFICATIONS: notifications });

    return Response.json([
      {
        name: 'Pending Prescriptions',
        value: notifications.PendingPrescriptionsCount,
        path: '/notifications/dosespot/pending-prescriptions',
      },
      {
        name: 'Transmission Errors',
        value: notifications.TransactionErrorsCount,
        path: '/notifications/dosespot/transmission-errors',
      },
      {
        name: 'RxChange Requests',
        value: notifications.PendingRxChangeCount,
        path: '/notifications/dosespot/rxchange-requests',
      },
    ]);
  } catch (err) {
    return Response.json(err, { status: 422 });
  }
}

import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from '../../_utils/createDosespotToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dosespotProviderId = searchParams.get('dosespotProviderId');
    const notificationType = searchParams.get('type'); // 'prescriptions', 'errors', 'rxchanges'
    const pageNumber = searchParams.get('pageNumber') || '1';
    const pageSize = searchParams.get('pageSize') || '50';

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId query parameter is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(Number.parseInt(dosespotProviderId));

    let endpoint = '/api/notifications/counts'; // Default endpoint
    const queryParams = new URLSearchParams();

    // Determine endpoint based on notification type
    switch (notificationType) {
      case 'prescriptions':
        endpoint = '/api/notifications/pending-prescriptions';
        queryParams.append('pageNumber', pageNumber);
        queryParams.append('pageSize', pageSize);
        break;
      case 'errors':
        endpoint = '/api/notifications/transmission-errors';
        queryParams.append('pageNumber', pageNumber);
        queryParams.append('pageSize', pageSize);
        break;
      case 'rxchanges':
        endpoint = '/api/notifications/pending-rxchanges';
        queryParams.append('pageNumber', pageNumber);
        queryParams.append('pageSize', pageSize);
        break;
      default:
        // Return summary counts if no specific type requested
        endpoint = '/api/notifications/counts';
        break;
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2${endpoint}${queryParams.toString() ? `?${queryParams}` : ''}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    console.log({ NOTIFICATION_DETAILS_REQUEST: options });

    const { data: notificationDetails } = await axios(options);

    console.log({ NOTIFICATION_DETAILS: notificationDetails });

    // Format response based on type
    if (!notificationType) {
      // Return summary counts
      return Response.json({
        summary: [
          {
            name: 'Pending Prescriptions',
            value: notificationDetails.PendingPrescriptionsCount || 0,
            type: 'prescriptions',
          },
          {
            name: 'Transmission Errors',
            value: notificationDetails.TransactionErrorsCount || 0,
            type: 'errors',
          },
          {
            name: 'RxChange Requests',
            value: notificationDetails.PendingRxChangeCount || 0,
            type: 'rxchanges',
          },
        ],
      });
    }

    // Return detailed items for specific type
    return Response.json({
      type: notificationType,
      items: notificationDetails.Items || notificationDetails,
      pagination: notificationDetails.PageResult || null,
    });
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dosespotProviderId,
      notificationType,
      pageNumber = 1,
      pageSize = 50
    } = body;

    if (!dosespotProviderId) {
      throw new Error(`Dosespot provider id was not provided`);
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    let endpoint = '/api/notifications/counts'; // Default endpoint
    let queryParams = new URLSearchParams();

    // Determine endpoint based on notification type
    switch (notificationType) {
      case 'prescriptions':
        endpoint = '/api/notifications/pending-prescriptions';
        queryParams.append('pageNumber', pageNumber.toString());
        queryParams.append('pageSize', pageSize.toString());
        break;
      case 'errors':
        endpoint = '/api/notifications/transmission-errors';
        queryParams.append('pageNumber', pageNumber.toString());
        queryParams.append('pageSize', pageSize.toString());
        break;
      case 'rxchanges':
        endpoint = '/api/notifications/pending-rxchanges';
        queryParams.append('pageNumber', pageNumber.toString());
        queryParams.append('pageSize', pageSize.toString());
        break;
      default:
        // Return summary counts if no specific type requested
        endpoint = '/api/notifications/counts';
        break;
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2${endpoint}${queryParams.toString() ? `?${queryParams}` : ''}`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
    };

    console.log({ NOTIFICATION_DETAILS_REQUEST: options });

    const { data: notificationDetails } = await axios(options);

    console.log({ NOTIFICATION_DETAILS: notificationDetails });

    // Format response based on type
    if (!notificationType) {
      // Return summary counts
      return Response.json({
        summary: [
          {
            name: 'Pending Prescriptions',
            value: notificationDetails.PendingPrescriptionsCount || 0,
            type: 'prescriptions',
          },
          {
            name: 'Transmission Errors',
            value: notificationDetails.TransactionErrorsCount || 0,
            type: 'errors',
          },
          {
            name: 'RxChange Requests',
            value: notificationDetails.PendingRxChangeCount || 0,
            type: 'rxchanges',
          },
        ],
      });
    }

    // Return detailed items for specific type
    return Response.json({
      type: notificationType,
      items: notificationDetails.Items || notificationDetails,
      pagination: notificationDetails.PageResult || null,
    });
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

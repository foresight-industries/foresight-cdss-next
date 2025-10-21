import axios from 'axios';
import { DosespotToken } from '@/types/dosespot';

export const createDosespotToken = async (dosespotProviderId: number) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL is not defined');
  }

  try {
    const options = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        accept: 'application/json; charset=utf-8',
      },
      data: {
        grant_type: 'password',
        client_id: process.env.DOSESPOT_CLINIC_ID,
        client_secret: process.env.DOSESPOT_CLINIC_KEY,
        username: dosespotProviderId,
        password: process.env.DOSESPOT_CLINIC_KEY,
        scope: 'api',
      },
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/connect/token`,
    };

    return await axios<DosespotToken>(options);
  } catch (err) {
    console.error('CREATE DOSESPOT TOKEN ERR', err);
    throw err;
  }
};

export const createProxyDosespotToken = async (
  dosespotCoordinatorId: number,
  dosespotProviderId: number
) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL is not defined');
  }

  try {
    const options = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        accept: 'application/json; charset=utf-8',
      },
      data: {
        grant_type: 'password',
        client_id: process.env.DOSESPOT_CLINIC_ID,
        client_secret: process.env.DOSESPOT_CLINIC_KEY,
        username: String(dosespotCoordinatorId),
        password: process.env.DOSESPOT_CLINIC_KEY,
        scope: 'api',
        acr_values: `OnBehalfOfUserId=${String(dosespotProviderId)}`,
      },
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/connect/token`,
    };
    console.log('PROXY REQUEST: ', options);

    return await axios<DosespotToken>(options);
  } catch (err) {
    console.error('CREATE DOSESPOT TOKEN ERR', err);
    throw err;
  }
};

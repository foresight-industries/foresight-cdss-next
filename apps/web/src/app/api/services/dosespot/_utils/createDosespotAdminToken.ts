import axios from 'axios';
import { DosespotToken } from '@/types/dosespot';

export const createDosespotAdminToken = async () => {
  try {
    if (!process.env.DOSESPOT_BASE_URL) {
      throw new Error('DOSESPOT_BASE_URL is not defined');
    }

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
        username: process.env.DOSESPOT_ADMIN_USER_ID,
        password: process.env.DOSESPOT_CLINIC_KEY,
        scope: 'api',
      },
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/connect/token`,
    };

    return axios<DosespotToken>(options);
  } catch (err) {
    console.error('CREATE DOSESPOT ADMIN TOKEN ERR', err);
    throw err;
  }
};

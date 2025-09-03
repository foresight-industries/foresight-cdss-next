import axios from 'axios';

type DosespotToken = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  userName: string;
  '.issued': Date;
  '.expires': Date;
};

export const createDosespotToken = async (dosespotProviderId: number) => {
  if (
    !process.env.DOSESPOT_SUBSCRIPTION_KEY ||
    !process.env.DOSESPOT_CLINIC_ID ||
    !process.env.DOSESPOT_CLINIC_KEY ||
    !process.env.DOSESPOT_BASE_URL
  ) {
    throw new Error('DOSESPOT_SUBSCRIPTION_KEY, DOSESPOT_CLINIC_ID, DOSESPOT_CLINIC_KEY, or DOSESPOT_BASE_URL is not set');
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
      username: dosespotProviderId,
      password: process.env.DOSESPOT_CLINIC_KEY,
      scope: 'api',
    },
    url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/connect/token`,
  };

  return axios<DosespotToken>(options);
};

export const createProxyDosespotToken = async (
  dosespotCoordinatorId: number,
  dosespotProviderId: number
) => {
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
  return axios<DosespotToken>(options);
};

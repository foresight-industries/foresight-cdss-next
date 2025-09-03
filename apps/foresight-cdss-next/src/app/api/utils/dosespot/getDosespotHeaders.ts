export const getDosespotHeaders = (access_token: string) => {
  if (process.env.DOSESPOT_VERSION === 'V2') {
    return {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${access_token}`,
    };
  }

  return {
    Authorization: `Bearer ${access_token}`,
  };
};

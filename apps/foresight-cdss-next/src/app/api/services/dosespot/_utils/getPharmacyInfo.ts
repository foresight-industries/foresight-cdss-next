import axios from 'axios';
import { DosespotPharmacyInformationResponse } from './types';

export const getPharmacyInfo = async (pharmacyId: number, token: string) => {
  const pharmacyInfoOption = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/pharmacies/${pharmacyId}`,
  };

  const { data: pharmacy } = await axios<DosespotPharmacyInformationResponse>(
    pharmacyInfoOption
  );

  if (pharmacy.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: PharmacyById, PharmacyId: ${pharmacyId}}`;
    throw new Error(pharmacy.Result.ResultDescription + `. ${details}`);
  }

  return pharmacy.Item;
};

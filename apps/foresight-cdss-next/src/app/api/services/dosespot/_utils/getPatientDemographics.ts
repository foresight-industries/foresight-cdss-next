import axios from 'axios';
import { DosespotPatientDemographicsResponse } from './types';

export const getPatientDemographics = async (
  dosespotPatientId: number,
  token: string
) => {
  const options = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}`,
  };

  const { data: patient } = await axios<DosespotPatientDemographicsResponse>(
    options
  );

  if (patient.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: PatientDemographics, PatientId: ${dosespotPatientId}}`;
    throw new Error(patient.Result.ResultDescription + `. ${details}`);
  }

  return patient.Item;
};

import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from './createDosespotToken';
import { DosespotCreateCodedPrescriptionResponse } from '@/types/dosespot';
import { sendPrescription } from './sendPrescription';

type AddAndSendPrescriptionParams = {
  dosespot_patient_id: number;
  supply: {
    SupplyId: number;
    Refills: number;
    DispenseUnitId: number;
    Quantity: number;
    Directions: string;
    Status: number;
    NoSubstitutions: boolean;
    PharmacyNotes: string;
    DaysSupply: number;
    PharmacyId: number;
  };
  clinician: {
    id: number;
    dosespot_provider_id: number;
    profile_id: string;
  };
};

export const addAndSendSupply = async ({
  clinician,
  supply,
  dosespot_patient_id,
}: AddAndSendPrescriptionParams) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL environment variable is missing');
  }

  const { data: token } = await createDosespotToken(
    clinician.dosespot_provider_id
  );

  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/supply`,
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token.access_token}`,
    },
    data: supply,
  };

  // Create coded prescription
  const { data: codedSupply } =
    await axios<DosespotCreateCodedPrescriptionResponse>(options);

  if (codedSupply.Result.ResultCode === 'ERROR') {
    throw new Error(
      codedSupply.Result.ResultDescription ||
      `Could not create prescription for dosespot patient id: ${dosespot_patient_id}`
    );
  }

  console.log({ CODED_PRESCRIPTION: codedSupply });

  // Send prescription to
  return sendPrescription(token.access_token, {
    PrescriptionId: codedSupply.Id,
    dosespotPatientId: dosespot_patient_id,
  });
};

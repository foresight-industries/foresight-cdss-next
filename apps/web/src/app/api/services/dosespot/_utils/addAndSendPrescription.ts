import axios, { AxiosRequestConfig } from 'axios';
import { createDosespotToken } from './createDosespotToken';
import { DosespotCreateCodedPrescriptionResponse } from '@/types/dosespot';
import { sendPrescription } from './sendPrescription';

type AddAndSendPrescriptionParams = {
  dosespot_patient_id: number;
  prescription: {
    DispensableDrugId: number;
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

export const addAndSendPrescription = async ({
  clinician,
  prescription,
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
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespot_patient_id}/prescriptions/coded`,
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token.access_token}`,
    },
    data: prescription,
  };
  console.log('options:', options);
  // Create coded prescription
  const { data: codedPrescription } =
    await axios<DosespotCreateCodedPrescriptionResponse>(options);

  console.log({ CODED_PRESCRIPTION: codedPrescription });

  if (codedPrescription.Result.ResultCode === 'ERROR') {
    console.error('CODED_PRESCRIPTION_ERR', codedPrescription);
    throw new Error(
      codedPrescription.Result.ResultDescription ||
      `Could not create prescription for dosespot patient id: ${dosespot_patient_id}`
    );
  }

  // Send prescription to
  return sendPrescription(token.access_token, {
    PrescriptionId: codedPrescription.Id,
    dosespotPatientId: dosespot_patient_id,
  });
};

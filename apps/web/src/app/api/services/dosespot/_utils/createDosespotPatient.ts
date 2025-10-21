import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { getDosespotPatientUrl } from '@/app/api/utils/dosespot/getDosespotPatientUrl';
import { getDosespotHeaders } from '@/app/api/utils/dosespot/getDosespotHeaders';
import axios, { AxiosRequestConfig } from 'axios';
import { Patient, patients, addresses } from '@foresight-cdss-next/db';
import { eq, and, isNull } from 'drizzle-orm';

enum PrimaryPhoneTypeEnum {
  Beeper = 1,
  Cell = 2,
  Fax = 3,
  Home = 4,
  Work = 5,
  Night = 6,
  Primary = 7,
}

enum GenderEnum {
  Male = 1,
  Female = 2,
  Unknown = 3,
}

enum WeightUnits {
  Lb = 1,
  Kg = 2,
}

enum HeightUnits {
  In = 1,
  Cm = 2,
}

type CreateDosespotPatientInput = {
  FirstName: string;
  LastName: string;
  MiddleName?: string | null;
  Suffix?: string | null;
  Email: string;
  DateOfBirth: string;
  Gender: GenderEnum;
  PrimaryPhone: string;
  PrimaryPhoneType: PrimaryPhoneTypeEnum;
  Address1: string;
  Address2: string | null;
  City: string;
  State: string;
  ZipCode: string;
  Active: boolean;
  Weight?: number;
  WeightMetric?: WeightUnits;
  Height?: number;
  HeightMetric?: HeightUnits;
  IsHospice: boolean;
};

type PatientDosespotCreated = {
  Id?: number;
  Result: {
    ResultCode: string;
    ResultDescription: string;
  };
};

export const createDosespotPatient = async (
  patient: Patient,
  token: string
) => {
  console.log({
    level: 'info',
    message: `Creating dosespot patient for ${patient.id}`,
  });

  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Get patient address - using the primary address
    const { data: address } = await safeSingle(async () =>
      db.select({
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        city: addresses.city,
        state: addresses.state,
        zipCode: addresses.zipCode,
      })
      .from(addresses)
      .where(and(
        eq(addresses.patientId, patient.id),
        eq(addresses.isPrimary, true),
        isNull(addresses.deletedAt)
      ))
    );

    if (!address) {
      throw new Error(`Could not find primary address for patientId: ${patient.id}`);
    }

    // Use patient data directly from the patients table (no separate profile table in AWS schema)
    if (!patient.firstName || !patient.lastName) {
      throw new Error(`Patient ${patient.id} is missing required name fields`);
    }

    if (!patient.email) {
      throw new Error(`Patient ${patient.id} does not have email`);
    }

    if (!patient.dateOfBirth) {
      throw new Error(`Patient ${patient.id} does not have date of birth`);
    }

    // Use the primary phone (mobile first, then home, then work)
    const primaryPhone = patient.phoneMobile || patient.phoneHome || patient.phoneWork;
    if (!primaryPhone) {
      throw new Error(`Patient ${patient.id} does not have phone number`);
    }

    const formattedPhoneNumber = primaryPhone
      .replace('+1', '')
      .replaceAll(/\D+/g, '');

    if (formattedPhoneNumber.length > 10) {
      throw new Error(
        `Patient ${patient.id}. Phone of type Primary and number ${primaryPhone} is not a valid phone number.`
      );
    }

    console.log({
      level: 'info',
      message: `Getting dosespot token to create dosespot patient for ${patient.id}`,
    });

    const patientInput: CreateDosespotPatientInput = {
      FirstName: patient.firstName,
      LastName: patient.lastName,
      MiddleName: patient.middleName,
      Email: patient.email,
      DateOfBirth: patient.dateOfBirth,
      PrimaryPhone: formattedPhoneNumber,
      PrimaryPhoneType: PrimaryPhoneTypeEnum.Primary,
      Gender: patient.gender === 'M' ? GenderEnum.Male : patient.gender === 'F' ? GenderEnum.Female : GenderEnum.Unknown,
      Address1: address.addressLine1,
      Address2: address.addressLine2,
      City: address.city,
      ZipCode: address.zipCode,
      State: address.state,
      Active: true,
      IsHospice: false,
    };

    if (patient.height) {
      patientInput.Height = patient.height;
      patientInput.HeightMetric = HeightUnits.In;
    }

    if (patient.weight) {
      patientInput.Weight = patient.weight;
      patientInput.WeightMetric = WeightUnits.Lb;
    }

    console.log({ PATIENT_INPUT: patientInput });

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: getDosespotPatientUrl(),
      data: patientInput,
      headers: getDosespotHeaders(token),
    };

    const { data: dosespotPatient } =
      await axios<PatientDosespotCreated>(options);

    console.log({ DOSESPOT_PATIENT: dosespotPatient });

    if (!dosespotPatient.Id || dosespotPatient.Result.ResultCode === 'ERROR') {
      throw new Error(
        dosespotPatient.Result.ResultDescription ||
        `Could not create dosespot patient for patientId ${patient.id}`
      );
    }

    // Update patient with DoseSpot patient ID using AWS DB
    const { data: updatedPatient } = await safeSingle(async () =>
      db.update(patients)
        .set({
          dosespotPatientId: Number(dosespotPatient.Id),
          updatedAt: new Date(),
        })
        .where(eq(patients.id, patient.id))
        .returning({
          id: patients.id,
        })
    );

    return {
      id: updatedPatient?.id || patient.id,
      dosespotPatientId: dosespotPatient.Id
    };
  } catch (err) {
    console.error({
      level: 'error',
      message: `Could not create dosespot patient for patientId ${patient.id}`,
      error: err,
    });
    throw err;
  }
};

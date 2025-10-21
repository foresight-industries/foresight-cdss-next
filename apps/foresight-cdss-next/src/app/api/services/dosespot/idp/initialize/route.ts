import { NextRequest } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { DosespotIDPInitializeResponse } from '@/types/dosespot';
import { createDosespotToken } from '../../_utils/createDosespotToken';

export type DosespotIDPInitializeRequestBody = {
  dosespotProviderId: number;
  FirstName: string;
  MiddleName?: string;
  LastName: string;
  PhoneNumber: string;
  DateOfBirth: string;
  HomeAddress: string;
  City: string;
  State: string;
  ZipCode: string;
  DrivingLicenseNumber?: string;
  DrivingLicenseNumberState?: string;
  SocialSecurityNumber: string;
  CreditCardNumber: string;
  IsMobileNumber: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotIDPInitializeRequestBody;
    const { dosespotProviderId, ...data } = body;

    // Validate required fields
    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    const requiredFields = [
      'FirstName', 'LastName', 'PhoneNumber', 'DateOfBirth',
      'HomeAddress', 'City', 'State', 'ZipCode',
      'SocialSecurityNumber', 'CreditCardNumber'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof typeof data] || String(data[field as keyof typeof data]).trim() === '') {
        return Response.json(
          { message: `${field} is required and cannot be empty` },
          { status: 400 }
        );
      }
    }

    // Validate IsMobileNumber is boolean
    if (typeof data.IsMobileNumber !== 'boolean') {
      return Response.json(
        { message: 'IsMobileNumber must be a boolean value' },
        { status: 400 }
      );
    }

    // Validate date format (assuming YYYY-MM-DD or MM/DD/YYYY)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(data.DateOfBirth)) {
      return Response.json(
        { message: 'DateOfBirth must be in YYYY-MM-DD or MM/DD/YYYY format' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(data.PhoneNumber)) {
      return Response.json(
        { message: 'PhoneNumber format is invalid' },
        { status: 400 }
      );
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(data.ZipCode)) {
      return Response.json(
        { message: 'ZipCode must be in 12345 or 12345-1234 format' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/idp`,
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        ...data,
        // Ensure strings are trimmed
        FirstName: data.FirstName.trim(),
        MiddleName: data.MiddleName?.trim(),
        LastName: data.LastName.trim(),
        PhoneNumber: data.PhoneNumber.trim(),
        DateOfBirth: data.DateOfBirth.trim(),
        HomeAddress: data.HomeAddress.trim(),
        City: data.City.trim(),
        State: data.State.trim(),
        ZipCode: data.ZipCode.trim(),
        DrivingLicenseNumber: data.DrivingLicenseNumber?.trim(),
        DrivingLicenseNumberState: data.DrivingLicenseNumberState?.trim(),
        SocialSecurityNumber: data.SocialSecurityNumber.trim(),
        CreditCardNumber: data.CreditCardNumber.trim(),
      },
    };

    const response = await axios<DosespotIDPInitializeResponse>(options);
    const { data: result } = response;

    if (result.Result.ResultCode === 'ERROR') {
      console.log({ RESULT: result });
      throw new Error(
        result.Result.ResultDescription ||
        `Could not initialize IDP for provider: ${dosespotProviderId}`
      );
    }

    console.log({ RESULT: result });

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}

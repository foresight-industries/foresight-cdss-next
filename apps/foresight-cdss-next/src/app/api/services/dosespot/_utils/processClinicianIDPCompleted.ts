import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { clinicians } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

export type ClinicianIDPCompleteSuccess = {
  ClinicianId: number;
  ClinicianIDPCompleteDate: string;
  IDPCompleteType: string;
};

export const processClinicianIDPCompleteSuccess = async (
  Data: ClinicianIDPCompleteSuccess
) => {
  const { db } = createDatabaseAdminClient();

  return await safeSingle(async () =>
    db.update(clinicians)
      .set({
        dosespotIdpCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(clinicians.dosespotProviderId, Data.ClinicianId))
      .returning({ id: clinicians.id })
  );
};

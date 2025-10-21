import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { clinicians } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

export type ClinicianConfirmed = {
  ClinicianId: number;
};

export const processClinicianConfirmed = async (Data: ClinicianConfirmed) => {
  const { db } = createDatabaseAdminClient();

  return await safeSingle(async () =>
    db.update(clinicians)
      .set({
        dosespotConfirmed: true,
        updatedAt: new Date(),
      })
      .where(eq(clinicians.dosespotProviderId, Data.ClinicianId))
      .returning({ id: clinicians.id })
  );
};

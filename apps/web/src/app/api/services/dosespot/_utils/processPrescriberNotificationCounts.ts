import { createDatabaseAdminClient, safeSingle } from '@/lib/aws/database';
import { PrescriberNotificationCountsData } from '@/types/dosespot';
import { clinicians } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

export const processPrescriberNotificationCounts = async (
  Data: PrescriberNotificationCountsData
) => {
  const { Total } = Data;

  const total =
    Total.PendingPrescriptionCount +
    Total.TransmissionErrorCount +
    Total.RefillRequestCount +
    Total.ChangeRequestCount;

  const dosespotProviderId = Data.ClinicianId;

  const { db } = createDatabaseAdminClient();

  return await safeSingle(async () =>
    db.update(clinicians)
      .set({
        dosespotNotificationsCount: total,
        updatedAt: new Date(),
      })
      .where(eq(clinicians.dosespotProviderId, dosespotProviderId))
      .returning({ id: clinicians.id })
  );
};

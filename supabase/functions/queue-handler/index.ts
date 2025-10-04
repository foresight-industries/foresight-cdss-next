import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import PgBoss from "npm:pg-boss@11.0.5";

const boss = new PgBoss(process.env.SUPABASE_URL);

serve(async (req) => {
  const { queue, action, data } = await req.json();

  switch (queue) {
    case "claim-submission":
      await boss.send("submit-claims", data, {
        retryLimit: 3,
        expireInHours: 24,
      });
      break;

    case "eligibility-check":
      // Batch for efficiency
      await boss.sendBatch(
        data.patients.map((p) => ({
          name: "check-eligibility",
          data: { patientId: p.id },
        }))
      );
      break;
  }
});

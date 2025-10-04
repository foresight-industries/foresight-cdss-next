// hooks/claims/useClaimWorkflow.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export function useClaimWorkflow(claimId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch claim with related data
  const claim = useQuery({
    queryKey: queryKeys.claims.detail(claimId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claim")
        .select(
          `
          *,
          patient:patient_id (
            id, profile_id,
            patient_profile!inner (first_name, last_name, birth_date),
            insurance_policy (*)
          ),
          payer:payer_id (id, name, external_payer_id),
          encounter:encounter_id (*),
          claim_line (*),
          claim_validation (*),
          denial_tracking (*)
        `
        )
        .eq("id", claimId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!claimId,
  });

  // Submit claim mutation with optimistic updates
  const submitClaim = useMutation({
    mutationFn: async () => {
      // Validate claim readiness
      const { data: validation } = await supabase
        .rpc("get_claim_readiness_score", { p_claim_id: claimId })
        .single();

      if (validation?.readiness_score ?? 0 < 95) {
        throw new Error("Claim not ready for submission");
      }

      // Update claim status
      const { data, error } = await supabase
        .from("claim")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          attempt_count: supabase.sql`attempt_count + 1`,
        })
        .eq("id", claimId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.claims.detail(claimId),
      });

      const previousClaim = queryClient.getQueryData(
        queryKeys.claims.detail(claimId)
      );

      // Optimistic update
      queryClient.setQueryData(
        queryKeys.claims.detail(claimId),
        (old: any) => ({
          ...old,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
      );

      return { previousClaim };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(
        queryKeys.claims.detail(claimId),
        context?.previousClaim
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.claims.detail(claimId),
      });
    },
  });

  return { claim, submitClaim };
}

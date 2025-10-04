// hooks/claims/useClaimWorkflow.ts
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

// Define the return type for the complex claim query
type ClaimWithRelatedData = Tables<"claim"> & {
  encounter: (Tables<"encounter"> & {
    patient: {
      id: number;
      profile_id: number | null;
      patient_profile: {
        first_name: string | null;
        last_name: string | null;
        birth_date: string | null;
      };
      insurance_policy: Tables<"insurance_policy">[];
    } | null;
  }) | null;
  payer: {
    id: number;
    name: string;
    external_payer_id: string;
  } | null;
  claim_line: Tables<"claim_line">[];
  claim_validation: Tables<"claim_validation">[];
  denial_tracking: Tables<"denial_tracking">[];
};

export function useClaimWorkflow(claimId: string): {
  claim: UseQueryResult<ClaimWithRelatedData | null, Error>;
  submitClaim: UseMutationResult<Tables<"claim">, Error, void, { previousClaim: unknown }>;
} {
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
          encounter:encounter_id (
            *,
            patient:patient_id (
              id, profile_id,
              patient_profile!inner (first_name, last_name, birth_date),
              insurance_policy (*)
            )
          ),
          payer:payer_id (id, name, external_payer_id),
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

      // First get current attempt count
      const { data: currentClaim } = await supabase
        .from("claim")
        .select("attempt_count")
        .eq("id", claimId)
        .single();

      // Update claim status with incremented attempt count
      const { data, error } = await supabase
        .from("claim")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          attempt_count: (currentClaim?.attempt_count || 0) + 1,
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

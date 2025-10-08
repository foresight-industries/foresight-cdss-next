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
  scrubbing_result: Tables<"scrubbing_result">[];
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
          denial_tracking (*),
          scrubbing_result!scrubbing_result_entity_id_fkey (*)
        `
        )
        .eq("id", claimId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!claimId,
  });

  // Submit claim mutation using submit-claim-batch function
  const submitClaim = useMutation({
    mutationFn: async () => {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Call the submit-claim-batch Supabase function
      const { data, error } = await supabase.functions.invoke("submit-claim-batch", {
        body: {
          claimIds: [claimId],
          clearinghouseId: "CLAIM_MD", // Default clearinghouse identifier
          userId: currentUserId
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to submit claim");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Claim submission failed");
      }

      return data;
    },
    onError: (error) => {
      // Show error to user - could be enhanced with toast system
      console.error("Claim submission failed:", error);
      // For now, we'll let the component handle error display
    },
    onSettled: () => {
      // Always refresh claim data after submission attempt
      queryClient.invalidateQueries({
        queryKey: queryKeys.claims.detail(claimId),
      });
    },
  });

  return { claim, submitClaim };
}

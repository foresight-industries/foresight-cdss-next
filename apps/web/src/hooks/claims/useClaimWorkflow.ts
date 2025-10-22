import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

// Define the return type for the complex claim query (AWS schema based)
type ClaimWithRelatedData = {
  id: string;
  organizationId: string;
  patientId: string;
  providerId: string;
  payerId: string;
  status: string;
  totalAmount: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  encounter?: {
    id: string;
    patientId: string;
    providerId: string;
    serviceDate: string;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      insurancePolicies?: any[];
    };
  };
  payer?: {
    id: string;
    name: string;
    externalPayerId: string;
  };
  claimLines?: any[];
  validations?: any[];
  denialTracking?: any[];
  scrubbingResults?: any[];
};

export function useClaimWorkflow(claimId: string) {
  const queryClient = useQueryClient();

  // Fetch claim with related data
  const claim = useQuery({
    queryKey: queryKeys.claims.detail(claimId),
    queryFn: async (): Promise<ClaimWithRelatedData | null> => {
      const response = await fetch(`/api/claims/${claimId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch claim data');
      }
      
      const data = await response.json();
      return data as ClaimWithRelatedData;
    },
    enabled: !!claimId,
  });

  // Submit claim mutation using API endpoint
  const submitClaim = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/claims/${claimId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clearinghouseId: "CLAIM_MD", // Default clearinghouse identifier
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit claim");
      }

      const data = await response.json();
      
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

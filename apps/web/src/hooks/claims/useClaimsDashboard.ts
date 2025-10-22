import { useQueries } from "@tanstack/react-query";

// Define types for AWS schema-based dashboard data
type ClaimDashboard = {
  organizationId: string;
  totalClaims: number;
  submittedClaims: number;
  paidClaims: number;
  deniedClaims: number;
  pendingClaims: number;
  totalAmount: number;
  paidAmount: number;
  deniedAmount: number;
  pendingAmount: number;
  averageProcessingTime: number;
  month: string;
};

type DenialAnalytics = {
  organizationId: string;
  denialCode: string;
  denialReason: string;
  denialCount: number;
  financialImpact: number;
  appealable: boolean;
  averageDaysToResolve: number;
};

type ARAgingSummary = {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
  totalOutstanding: number;
};

export function useClaimsDashboard(organizationId: string): {
  claimMetrics: ClaimDashboard[] | null | undefined;
  arAging: ARAgingSummary | null | undefined;
  topDenials: DenialAnalytics[] | null | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "claims", organizationId],
        queryFn: async () => {
          const response = await fetch(`/api/claims/dashboard/metrics?organizationId=${organizationId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch claim metrics');
          }
          return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 min for dashboard
      },
      {
        queryKey: ["dashboard", "ar-aging", organizationId],
        queryFn: async () => {
          const response = await fetch(`/api/claims/dashboard/ar-aging?organizationId=${organizationId}&asOfDate=${new Date().toISOString()}`);
          if (!response.ok) {
            throw new Error('Failed to fetch AR aging data');
          }
          return response.json();
        },
        staleTime: 1000 * 60 * 15, // 15 min for aging
      },
      {
        queryKey: ["dashboard", "denial-analytics", organizationId],
        queryFn: async () => {
          const response = await fetch(`/api/claims/dashboard/denials?organizationId=${organizationId}&appealable=true&limit=10`);
          if (!response.ok) {
            throw new Error('Failed to fetch denial analytics');
          }
          return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 min for denials
      },
    ],
  });

  return {
    claimMetrics: queries[0].data,
    arAging: queries[1].data,
    topDenials: queries[2].data,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

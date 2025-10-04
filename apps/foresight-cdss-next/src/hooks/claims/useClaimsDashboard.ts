// hooks/useClaimsDashboard.ts
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useClaimsDashboard(teamId: string) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "claims", teamId],
        queryFn: () =>
          supabase.from("claim_dashboard").select("*").eq("team_id", teamId),
        staleTime: 1000 * 60 * 10, // 10 min for dashboard
      },
      {
        queryKey: ["dashboard", "ar-aging", teamId],
        queryFn: () =>
          supabase.rpc("get_ar_aging_summary", {
            p_team_id: teamId,
            p_as_of_date: new Date().toISOString(),
          }),
        staleTime: 1000 * 60 * 15, // 15 min for aging
      },
      {
        queryKey: ["dashboard", "denial-analytics", teamId],
        queryFn: () =>
          supabase
            .from("denial_analytics")
            .select("*")
            .eq("team_id", teamId)
            .eq("appealable", true)
            .order("financial_impact", { ascending: false })
            .limit(10),
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

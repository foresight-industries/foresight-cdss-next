import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkflowStore } from "@/stores/workflowStore";

// Sync store changes with React Query
export function useStoreSync() {
  const queryClient = useQueryClient();
  const claimFilters = useWorkflowStore((s) => s.claimFilters);
  const paFilters = useWorkflowStore((s) => s.paFilters);

  // Invalidate queries when filters change
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["claims", "list", claimFilters],
    });
  }, [claimFilters, queryClient]);

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["prior-auth", "list", paFilters],
    });
  }, [paFilters, queryClient]);
}

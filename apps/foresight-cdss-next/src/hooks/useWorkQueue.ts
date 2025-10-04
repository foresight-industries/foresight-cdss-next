// hooks/useWorkQueue.ts
import { supabase } from "@/lib/supabase";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useAppStore } from "@/stores/useAppStore";
import { queryClient } from "@/lib/query/queryClient";
import type { Tables } from "@/types/database.types";

export function useWorkQueue(): {
  assignedWork: UseQueryResult<Tables<"work_queue">[] | null, Error>;
  getNextItem: UseMutationResult<unknown, Error, void, unknown>;
} {
  const { teamMember } = useAppStore();

  const assignedWork = useQuery({
    queryKey: queryKeys.workQueue.assigned(teamMember?.id ?? ""),
    queryFn: async () => {
      const { data } = await supabase
        .from("work_queue")
        .select("*")
        .eq("assigned_to", teamMember?.id ?? "")
        .eq("status", "in_progress")
        .order("priority", { ascending: false })
        .order("sla_deadline", { ascending: true });

      return data;
    },
    refetchInterval: 1000 * 60 * 2, // Poll every 2 min
  });

  const getNextItem = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.rpc("get_next_work_item", {
        user_id: teamMember?.id ?? "",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workQueue.assigned(teamMember?.id ?? ""),
      });
    },
  });

  return { assignedWork, getNextItem };
}

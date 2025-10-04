// hooks/useRealtimeSubscription.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { queryKeys } from "@/lib/query/keys";

export function useClaimRealtimeUpdates(teamId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { subscriptions } = useAppStore();

  useEffect(() => {
    const channel = supabase
      .channel(`claims:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claim",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          // Update specific claim
          if (payload.eventType === "UPDATE") {
            queryClient.setQueryData(
              queryKeys.claims.detail(payload.new.id),
              payload.new
            );
          }

          // Invalidate list queries
          queryClient.invalidateQueries({
            queryKey: queryKeys.claims.list(),
            refetchType: "active",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "denial_tracking",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.new?.claim_id) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.claims.detail(payload.new.claim_id),
            });
          }
        }
      )
      .subscribe();

    subscriptions.add(channel);

    return () => {
      supabase.removeChannel(channel);
      subscriptions.delete(channel);
    };
  }, [teamId]);
}

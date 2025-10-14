import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}

export function useClaimRealtimeUpdates(organizationId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // For AWS, we would typically use AWS AppSync, EventBridge, or WebSocket API
    // This is a placeholder implementation using WebSockets
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/claims?organizationId=${organizationId}`);
    
    ws.onopen = () => {
      console.log(`Connected to claims realtime for organization ${organizationId}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload: RealtimePayload = JSON.parse(event.data);
        
        // Handle claims updates
        if (payload.eventType === 'UPDATE' && payload.new?.id) {
          queryClient.setQueryData(
            queryKeys.claims.detail(payload.new.id),
            payload.new
          );
        }

        // Invalidate list queries for claims
        void queryClient.invalidateQueries({
          queryKey: queryKeys.claims.list(),
          refetchType: "active",
        });

        // Handle denial tracking updates
        if (payload.new?.claimId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.claims.detail(payload.new.claimId),
          });
        }
      } catch (error) {
        console.error('Error parsing realtime message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for claims:`, error);
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [organizationId, queryClient]);
}

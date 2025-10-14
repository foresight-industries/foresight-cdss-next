import { useCallback, useEffect, useRef } from "react";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "../mainStore";
import type { Database, Tables } from "@/types/database.types";

type DatabaseTables = keyof Database["public"]["Tables"];

// Real-time subscription manager
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, () => void> = new Map();

  subscribe<T extends DatabaseTables>(
    table: T,
    callback: (payload: RealtimePostgresChangesPayload<Tables<T>>) => void,
    filter?: string
  ): () => void {
    const channelName = `${table}${filter ? `-${filter}` : ""}`;

    // Remove existing subscription if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table as string,
          filter,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    const unsubscribe = () => this.unsubscribe(channelName);
    this.subscriptions.set(channelName, unsubscribe);

    return unsubscribe;
  }

  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscriptions.delete(channelName);
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscriptions.clear();
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();

// Hook for managing real-time subscriptions
export const useRealtimeSubscription = <T extends DatabaseTables>(
  table: T,
  options: {
    enabled?: boolean;
    filter?: string;
    onInsert?: (record: Tables<T>) => void;
    onUpdate?: (record: Tables<T>) => void;
    onDelete?: (record: Partial<Tables<T>>) => void;
  } = {}
) => {
  const { enabled = true, filter, onInsert, onUpdate, onDelete } = options;

  const setRealtimeConnected = useAppStore(
    (state) => state.setRealtimeConnected
  );
  const updateRealtimeTimestamp = useAppStore(
    (state) => state.updateRealtimeTimestamp
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Tables<T>>) => {
      updateRealtimeTimestamp();

      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new);
          break;
        case "UPDATE":
          onUpdate?.(payload.new);
          break;
        case "DELETE":
          onDelete?.(payload.old as Partial<Tables<T>>);
          break;
      }
    },
    [onInsert, onUpdate, onDelete, updateRealtimeTimestamp]
  );

  useEffect(() => {
    if (!enabled) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    setRealtimeConnected(true);

    unsubscribeRef.current = realtimeManager.subscribe(
      table,
      handleChange,
      filter
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, table, filter, handleChange, setRealtimeConnected]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for patient real-time updates
export const usePatientRealtime = (enabled = true) => {
  const addPatient = useAppStore((state) => state.addPatient);
  const updatePatient = useAppStore((state) => state.updatePatient);
  const removePatient = useAppStore((state) => state.removePatient);

  useRealtimeSubscription("patient", {
    enabled,
    onInsert: (patient) => {
      addPatient(patient);
    },
    onUpdate: (patient) => {
      updatePatient(patient.id, patient);
    },
    onDelete: (patient) => {
      if (patient.id) {
        removePatient(patient.id);
      }
    },
  });
};

// Hook for claim real-time updates
export const useClaimRealtime = (enabled = true) => {
  const addClaim = useAppStore((state) => state.addClaim);
  const updateClaim = useAppStore((state) => state.updateClaim);
  const removeClaim = useAppStore((state) => state.removeClaim);

  useRealtimeSubscription("claim", {
    enabled,
    onInsert: (claim) => {
      addClaim(claim);
    },
    onUpdate: (claim) => {
      updateClaim(claim.id, claim);
    },
    onDelete: (claim) => {
      if (claim.id) {
        removeClaim(claim.id);
      }
    },
  });
};

// Hook for prior auth real-time updates
export const usePriorAuthRealtime = (enabled = true) => {
  const addPriorAuth = useAppStore((state) => state.addPriorAuth);
  const updatePriorAuth = useAppStore((state) => state.updatePriorAuth);
  const removePriorAuth = useAppStore((state) => state.removePriorAuth);

  useRealtimeSubscription("prior_auth", {
    enabled,
    onInsert: (priorAuth) => {
      addPriorAuth(priorAuth);
    },
    onUpdate: (priorAuth) => {
      updatePriorAuth(priorAuth.id, priorAuth);
    },
    onDelete: (priorAuth) => {
      if (priorAuth.id) {
        removePriorAuth(priorAuth.id);
      }
    },
  });
};

// Hook for payment real-time updates
export const usePaymentRealtime = (enabled = true) => {
  const addPaymentDetail = useAppStore((state) => state.addPaymentDetail);
  const updatePaymentDetail = useAppStore((state) => state.updatePaymentDetail);
  const removePaymentDetail = useAppStore((state) => state.removePaymentDetail);

  useRealtimeSubscription("payment_detail", {
    enabled,
    onInsert: (payment) => {
      addPaymentDetail(payment);
    },
    onUpdate: (payment) => {
      updatePaymentDetail(payment.id, payment);
    },
    onDelete: (payment) => {
      if (payment.id) {
        removePaymentDetail(payment.id);
      }
    },
  });
};

// Hook for team real-time updates (admin)
export const useTeamRealtime = (enabled = true) => {
  const addTeam = useAppStore((state) => state.addTeam);
  const updateTeam = useAppStore((state) => state.updateTeam);
  const removeTeam = useAppStore((state) => state.removeTeam);

  useRealtimeSubscription("team", {
    enabled,
    onInsert: (team) => {
      addTeam(team);
    },
    onUpdate: (team) => {
      updateTeam(team.id, team);
    },
    onDelete: (team) => {
      if (team.id) {
        removeTeam(team.id);
      }
    },
  });
};

// Hook for comprehensive real-time updates
export const useRealtimeUpdates = (
  options: {
    patients?: boolean;
    claims?: boolean;
    priorAuths?: boolean;
    payments?: boolean;
    teams?: boolean;
  } = {}
) => {
  const {
    patients = true,
    claims = true,
    priorAuths = true,
    payments = true,
    teams = true,
  } = options;

  usePatientRealtime(patients);
  useClaimRealtime(claims);
  usePriorAuthRealtime(priorAuths);
  usePaymentRealtime(payments);
  useTeamRealtime(teams);

  const setRealtimeConnected = useAppStore(
    (state) => state.setRealtimeConnected
  );

  useEffect(() => {
    // Monitor connection status
    const handleOnline = () => setRealtimeConnected(true);
    const handleOffline = () => setRealtimeConnected(false);

    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);

    return () => {
      globalThis.removeEventListener("online", handleOnline);
      globalThis.removeEventListener("offline", handleOffline);
    };
  }, [setRealtimeConnected]);
};

// Hook for filtered real-time subscriptions (e.g., by team)
export const useFilteredRealtime = (
  table: DatabaseTables,
  filter: string,
  enabled = true
) => {
  const updateRealtimeTimestamp = useAppStore(
    (state) => state.updateRealtimeTimestamp
  );

  useRealtimeSubscription(table, {
    enabled,
    filter,
    onInsert: () => updateRealtimeTimestamp(),
    onUpdate: () => updateRealtimeTimestamp(),
    onDelete: () => updateRealtimeTimestamp(),
  });
};

// Connection status hook
export const useRealtimeStatus = () => {
  const realtimeConnected = useAppStore((state) => state.realtimeConnected);
  const realtimeLastUpdate = useAppStore((state) => state.realtimeLastUpdate);
  const setRealtimeConnected = useAppStore(
    (state) => state.setRealtimeConnected
  );

  const activeSubscriptions = realtimeManager.getActiveSubscriptions();

  const reconnect = useCallback(() => {
    // Force reconnection by resubscribing to all active channels

    // const currentSubscriptions = realtimeManager.getActiveSubscriptions();
    realtimeManager.unsubscribeAll();

    // This would need to be implemented based on your app's specific needs
    // You might want to trigger a full app refresh or re-subscribe to specific channels
    setRealtimeConnected(false);

    setTimeout(() => {
      setRealtimeConnected(true);
    }, 1000);
  }, [setRealtimeConnected]);

  return {
    connected: realtimeConnected,
    lastUpdate: realtimeLastUpdate,
    activeSubscriptions,
    reconnect,
  };
};

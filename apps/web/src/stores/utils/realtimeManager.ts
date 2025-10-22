import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../mainStore";

// AWS database table names based on the schema
type DatabaseTables = 'patients' | 'claims' | 'priorAuths' | 'paymentDetails' | 'organizations' | 'appointments' | 'auditLogs';

interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
}

// AWS-based realtime manager (using WebSockets or AWS AppSync)
export class RealtimeManager {
  private readonly websockets: Map<string, WebSocket> = new Map();
  private readonly subscriptions: Map<string, () => void> = new Map();

  subscribe<T = any>(
    table: DatabaseTables,
    callback: (payload: RealtimePayload<T>) => void,
    filter?: string
  ): () => void {
    const channelName = `${table}${filter ? `-${filter}` : ""}`;

    // Remove existing subscription if it exists
    this.unsubscribe(channelName);

    // For AWS, we would typically use AWS AppSync, EventBridge, or WebSocket API
    // This is a placeholder implementation using WebSockets
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/${table}`);
    
    ws.onopen = () => {
      console.log(`Connected to realtime for ${table}`);
      if (filter) {
        ws.send(JSON.stringify({ type: 'filter', filter }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        callback(payload);
      } catch (error) {
        console.error('Error parsing realtime message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${table}:`, error);
    };

    this.websockets.set(channelName, ws);

    // Return unsubscribe function
    const unsubscribe = () => this.unsubscribe(channelName);
    this.subscriptions.set(channelName, unsubscribe);

    return unsubscribe;
  }

  unsubscribe(channelName: string): void {
    const ws = this.websockets.get(channelName);
    if (ws) {
      ws.close();
      this.websockets.delete(channelName);
      this.subscriptions.delete(channelName);
    }
  }

  unsubscribeAll(): void {
    for (const [, ws] of this.websockets) {
      ws.close();
    }
    this.websockets.clear();
    this.subscriptions.clear();
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.websockets.keys());
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();

// Hook for managing real-time subscriptions
export const useRealtimeSubscription = (
  table: DatabaseTables,
  options: {
    enabled?: boolean;
    filter?: string;
    onInsert?: (record: any) => void;
    onUpdate?: (record: any) => void;
    onDelete?: (record: any) => void;
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
    (payload: RealtimePayload) => {
      updateRealtimeTimestamp();

      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new);
          break;
        case "UPDATE":
          onUpdate?.(payload.new);
          break;
        case "DELETE":
          onDelete?.(payload.old);
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

  useRealtimeSubscription("patients", {
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

  useRealtimeSubscription("claims", {
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

  useRealtimeSubscription("priorAuths", {
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

  useRealtimeSubscription("paymentDetails", {
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

// Hook for organization real-time updates (admin)
export const useOrganizationRealtime = (enabled = true) => {
  const addOrganization = useAppStore((state) => state.addOrganization);
  const updateOrganization = useAppStore((state) => state.updateOrganization);
  const removeOrganization = useAppStore((state) => state.removeOrganization);

  useRealtimeSubscription("organizations", {
    enabled,
    onInsert: (organization) => {
      addOrganization(organization);
    },
    onUpdate: (organization) => {
      updateOrganization(organization.id, organization);
    },
    onDelete: (organization) => {
      if (organization.id) {
        removeOrganization(organization.id);
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
    organizations?: boolean;
  } = {}
) => {
  const {
    patients = true,
    claims = true,
    priorAuths = true,
    payments = true,
    organizations = true,
  } = options;

  usePatientRealtime(patients);
  useClaimRealtime(claims);
  usePriorAuthRealtime(priorAuths);
  usePaymentRealtime(payments);
  useOrganizationRealtime(organizations);

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

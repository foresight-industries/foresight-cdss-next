import { create } from "zustand";

// AWS AppSync GraphQL subscription for real-time updates
export interface AppSyncSubscription {
  id: string;
  subscriptionName: string;
  variables?: Record<string, any>;
  handler: (data: any) => void;
  isActive: boolean;
  lastUpdate?: Date;
}

// AppSync real-time data structure
export interface AppSyncEvent {
  subscriptionName: string;
  data: any;
  timestamp: Date;
  eventId: string;
  eventType: 'pa_status_change' | 'claim_update' | 'user_presence' | 'healthlake_sync' | 'ehr_event';
}

// EventBridge event for system-level healthcare events
interface EventBridgeEvent {
  source: string;
  detailType: string;
  detail: any;
  time: Date;
  resources?: string[];
}

interface RealtimeState {
  // Active AWS AppSync subscriptions
  appSyncSubscriptions: Map<string, AppSyncSubscription>;
  appSyncEvents: AppSyncEvent[];
  eventBridgeEvents: EventBridgeEvent[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  lastHeartbeat: Date | null;

  // User presence (for collaborative features)
  activeUsers: Map<
    string,
    {
      userId: string;
      userName: string;
      currentView: string;
      organizationId: string;
      lastSeen: Date;
      isOnline: boolean;
    }
  >;

  // Healthcare-specific real-time data
  realtimeMetrics: {
    activePAs: number;
    pendingClaims: number;
    ehrSyncStatus: Record<string, 'syncing' | 'idle' | 'error'>;
    healthLakeJobs: Array<{
      jobId: string;
      status: string;
      progress: number;
    }>;
  };

  // Actions
  addAppSyncSubscription: (key: string, subscription: AppSyncSubscription) => void;
  removeAppSyncSubscription: (key: string) => void;
  clearSubscriptions: () => void;

  triggerMutation: (mutationName: string, variables: any) => Promise<{ data: any }>;

  setConnectionStatus: (status: RealtimeState["connectionStatus"]) => void;
  updateHeartbeat: () => void;

  addAppSyncEvent: (event: AppSyncEvent) => void;
  addEventBridgeEvent: (event: EventBridgeEvent) => void;
  clearEventHistory: () => void;

  updateActiveUser: (
    userId: string,
    data: Partial<
      RealtimeState["activeUsers"] extends Map<string, infer V> ? V : never
    >
  ) => void;
  removeActiveUser: (userId: string) => void;

  updateRealtimeMetrics: (metrics: Partial<RealtimeState["realtimeMetrics"]>) => void;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  appSyncSubscriptions: new Map(),
  appSyncEvents: [],
  eventBridgeEvents: [],
  connectionStatus: "disconnected",
  lastHeartbeat: null,
  activeUsers: new Map(),
  realtimeMetrics: {
    activePAs: 0,
    pendingClaims: 0,
    ehrSyncStatus: {},
    healthLakeJobs: []
  },

  addAppSyncSubscription: (key, subscription) =>
    set((state) => {
      const newSubscriptions = new Map(state.appSyncSubscriptions);
      newSubscriptions.set(key, subscription);
      return { appSyncSubscriptions: newSubscriptions };
    }),

  removeAppSyncSubscription: (key) =>
    set((state) => {
      const newSubscriptions = new Map(state.appSyncSubscriptions);
      const subscription = newSubscriptions.get(key);
      if (subscription) {
        // Mark subscription as inactive and clean up
        subscription.isActive = false;
        newSubscriptions.delete(key);
      }
      return { appSyncSubscriptions: newSubscriptions };
    }),

  clearSubscriptions: () => {
    const { appSyncSubscriptions } = get();
    // Mark all subscriptions as inactive
    for (const subscription of appSyncSubscriptions.values()) {
      subscription.isActive = false;
    }
    set({ appSyncSubscriptions: new Map() });
  },

  triggerMutation: async (mutationName: string, variables: any) => {
    // Implementation using AWS AppSync GraphQL client
    console.log(`Triggering AppSync mutation ${mutationName}:`, variables);

    try {
      const { graphqlClient, UPDATE_CLAIM_STATUS, CREATE_PATIENT, CREATE_PRIOR_AUTH } = await import('@/lib/graphql/amplify-gql-client');

      let result;
      switch (mutationName) {
        case 'updateClaimStatus':
          result = await graphqlClient.graphql({ query: UPDATE_CLAIM_STATUS, variables: { input: variables } });
          break;
        case 'createPatient':
          result = await graphqlClient.graphql({ query: CREATE_PATIENT, variables: { input: variables } });
          break;
        case 'createPriorAuth':
          result = await graphqlClient.graphql({ query: CREATE_PRIOR_AUTH, variables: { input: variables } });
          break;
        default:
          throw new Error(`Unknown mutation: ${mutationName}`);
      }

      console.log(`✅ Mutation ${mutationName} executed successfully:`, result);

      // Update local state optimistically if needed
      if (mutationName === 'updateClaimStatus') {
        set((state) => ({
          realtimeMetrics: {
            ...state.realtimeMetrics,
            pendingClaims: variables.status === 'pending' ?
              state.realtimeMetrics.pendingClaims + 1 :
              state.realtimeMetrics.pendingClaims - 1
          }
        }));
      }

      return result as { data: any };
    } catch (error) {
      console.error(`❌ Failed to execute mutation ${mutationName}:`, error);
      throw error;
    }
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  updateHeartbeat: () => set({ lastHeartbeat: new Date() }),

  addAppSyncEvent: (event) =>
    set((state) => {
      const newEvents = [...state.appSyncEvents, event];
      // Keep only last 50 AppSync events to prevent memory issues
      const trimmedEvents = newEvents.slice(-50);
      return { appSyncEvents: trimmedEvents };
    }),

  addEventBridgeEvent: (event) =>
    set((state) => {
      const newEvents = [...state.eventBridgeEvents, event];
      // Keep only last 100 EventBridge events to prevent memory issues
      const trimmedEvents = newEvents.slice(-100);
      return { eventBridgeEvents: trimmedEvents };
    }),

  clearEventHistory: () => set({ appSyncEvents: [], eventBridgeEvents: [] }),

  updateActiveUser: (userId, data) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers);
      const existing = newUsers.get(userId) || {
        userId,
        userName: "",
        currentView: "",
        organizationId: "",
        lastSeen: new Date(),
        isOnline: false,
      };
      newUsers.set(userId, { ...existing, ...data });
      return { activeUsers: newUsers };
    }),

  removeActiveUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers);
      newUsers.delete(userId);
      return { activeUsers: newUsers };
    }),

  updateRealtimeMetrics: (metrics) =>
    set((state) => ({
      realtimeMetrics: { ...state.realtimeMetrics, ...metrics }
    })),
}));

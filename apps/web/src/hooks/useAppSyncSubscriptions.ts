import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import {
  subscribeToClaimStatusChanges,
  subscribeToMetricsUpdates,
  subscribeToNewPatients,
  type ClaimStatusChangeEvent,
  type RealtimeMetrics,
  type Patient,
} from '@/lib/graphql/appsync-client';

type EHRSyncStatus = Record<string, 'error' | 'syncing' | 'idle'>;

interface UseAppSyncSubscriptionsProps {
  enableClaimUpdates?: boolean;
  enableMetricsUpdates?: boolean;
  enableNewPatients?: boolean;
}

export function useAppSyncSubscriptions({
  enableClaimUpdates = true,
  enableMetricsUpdates = true,
  enableNewPatients = false,
}: UseAppSyncSubscriptionsProps = {}) {
  const organizationId = useSessionStore((state) => state.currentTeamId);

  const {
    addAppSyncSubscription,
    removeAppSyncSubscription,
    addAppSyncEvent,
    updateRealtimeMetrics,
    setConnectionStatus,
  } = useRealtimeStore();

  const subscriptionsRef = useRef<Map<string, { unsubscribe: () => void }>>(new Map());

  useEffect(() => {
    if (!organizationId) {
      console.log('No organization ID available, skipping AppSync subscriptions');
      return;
    }

    console.log(`Setting up AppSync subscriptions for organization: ${organizationId}`);
    setConnectionStatus('connecting');

    try {
      // Claim status change subscription
      if (enableClaimUpdates) {
        const claimSubscription = subscribeToClaimStatusChanges(
          organizationId,
          (event: ClaimStatusChangeEvent) => {
            console.log('Received claim status change:', event);

            // Add to event history
            addAppSyncEvent({
              subscriptionName: 'onClaimStatusChange',
              data: event,
              timestamp: new Date(),
              eventId: `claim_${event.claimId}_${Date.now()}`,
              eventType: 'claim_update',
            });

            // Emit custom event for components to listen
            globalThis.dispatchEvent(
              new CustomEvent('claimStatusChange', { detail: event })
            );
          }
        );

        subscriptionsRef.current.set('claimStatusChange', claimSubscription);
        addAppSyncSubscription('claimStatusChange', {
          id: 'claimStatusChange',
          subscriptionName: 'onClaimStatusChange',
          variables: { organizationId },
          handler: (data) => console.log('Claim status change handler:', data),
          isActive: true,
          lastUpdate: new Date(),
        });
      }

      // Real-time metrics subscription
      if (enableMetricsUpdates) {
        const metricsSubscription = subscribeToMetricsUpdates(
          organizationId,
          (metrics: RealtimeMetrics) => {
            console.log('Received metrics update:', metrics);

            // Update local metrics store
            updateRealtimeMetrics({
              activePAs: metrics.activePAs,
              pendingClaims: metrics.pendingClaims,
              ehrSyncStatus: metrics.ehrSyncStatus as EHRSyncStatus,
              healthLakeJobs: metrics.healthLakeJobs,
            });

            // Add to event history
            addAppSyncEvent({
              subscriptionName: 'onMetricsUpdate',
              data: metrics,
              timestamp: new Date(),
              eventId: `metrics_${Date.now()}`,
              eventType: 'healthlake_sync',
            });

            // Emit custom event
            window.dispatchEvent(
              new CustomEvent('metricsUpdate', { detail: metrics })
            );
          }
        );

        subscriptionsRef.current.set('metricsUpdate', metricsSubscription);
        addAppSyncSubscription('metricsUpdate', {
          id: 'metricsUpdate',
          subscriptionName: 'onMetricsUpdate',
          variables: { organizationId },
          handler: (data) => console.log('Metrics update handler:', data),
          isActive: true,
          lastUpdate: new Date(),
        });
      }

      // New patients subscription
      if (enableNewPatients) {
        const newPatientsSubscription = subscribeToNewPatients(
          organizationId,
          (patient: Patient) => {
            console.log('Received new patient:', patient);

            // Add to event history
            addAppSyncEvent({
              subscriptionName: 'onNewPatient',
              data: patient,
              timestamp: new Date(),
              eventId: `patient_${patient.id}_${Date.now()}`,
              eventType: 'user_presence',
            });

            // Emit custom event
            window.dispatchEvent(
              new CustomEvent('newPatient', { detail: patient })
            );
          }
        );

        subscriptionsRef.current.set('newPatients', newPatientsSubscription);
        addAppSyncSubscription('newPatients', {
          id: 'newPatients',
          subscriptionName: 'onNewPatient',
          variables: { organizationId },
          handler: (data) => console.log('New patient handler:', data),
          isActive: true,
          lastUpdate: new Date(),
        });
      }

      setConnectionStatus('connected');
      console.log('✅ AppSync subscriptions established successfully');

    } catch (error) {
      console.error('❌ Failed to establish AppSync subscriptions:', error);
      setConnectionStatus('error');
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up AppSync subscriptions');

      subscriptionsRef.current.forEach((subscription, key) => {
        try {
          subscription.unsubscribe();
          removeAppSyncSubscription(key);
          console.log(`Unsubscribed from ${key}`);
        } catch (error) {
          console.error(`Error unsubscribing from ${key}:`, error);
        }
      });

      subscriptionsRef.current.clear();
      setConnectionStatus('disconnected');
    };
  }, [
    organizationId,
    enableClaimUpdates,
    enableMetricsUpdates,
    enableNewPatients,
    addAppSyncSubscription,
    removeAppSyncSubscription,
    addAppSyncEvent,
    updateRealtimeMetrics,
    setConnectionStatus,
  ]);

  // Return subscription management functions
  return {
    isConnected: useRealtimeStore((state) => state.connectionStatus === 'connected'),
    connectionStatus: useRealtimeStore((state) => state.connectionStatus),
    activeSubscriptions: useRealtimeStore((state) => state.appSyncSubscriptions),
    recentEvents: useRealtimeStore((state) => state.appSyncEvents.slice(-10)),

    // Manual subscription control
    unsubscribeFromAll: () => {
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current.clear();
      setConnectionStatus('disconnected');
    },

    reconnect: () => {
      // This will trigger the useEffect to run again
      setConnectionStatus('connecting');
    },
  };
}

// Hook for listening to specific AppSync events
export function useAppSyncEvent<T = any>(
  eventName: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleEvent = (event: CustomEvent<T>) => {
      handler(event.detail);
    };

    window.addEventListener(eventName, handleEvent as EventListener);

    return () => {
      window.removeEventListener(eventName, handleEvent as EventListener);
    };
  }, [eventName, handler, ...deps]);
}

// Specialized hooks for common events
export function useClaimStatusChanges(
  handler: (event: ClaimStatusChangeEvent) => void,
  deps: React.DependencyList = []
) {
  useAppSyncEvent('claimStatusChange', handler, deps);
}

export function useMetricsUpdates(
  handler: (metrics: RealtimeMetrics) => void,
  deps: React.DependencyList = []
) {
  useAppSyncEvent('metricsUpdate', handler, deps);
}

export function useNewPatients(
  handler: (patient: Patient) => void,
  deps: React.DependencyList = []
) {
  useAppSyncEvent('newPatient', handler, deps);
}

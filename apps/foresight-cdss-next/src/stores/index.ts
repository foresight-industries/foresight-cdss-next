// stores/index.ts
// Main store exports
export * from './mainStore';
export * from './entities/patientStore';
export * from './entities/claimStore';
export * from './entities/priorAuthStore';
export * from './entities/paymentStore';
export * from './entities/providerStore';
export * from './entities/payerStore';
export * from './entities/adminStore';

// Utility exports
export * from './utils/storeUtils';
export * from './utils/realtimeManager';
export * from './utils/cacheManager';

// Legacy stores (keeping for backward compatibility)
export { useWorkflowStore } from './workflowStore';
export { useWorkQueueStore } from './workQueueStore';
export { useUIStore } from './uiStore';
export { useSessionStore } from './sessionStore';
export { useRealtimeStore } from './realtimeStore';

// Re-export configuration
export { ENABLE_DEVTOOLS } from './config';

// Re-export types
export type * from './types';

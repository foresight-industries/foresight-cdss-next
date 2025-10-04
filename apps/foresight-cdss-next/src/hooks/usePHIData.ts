// hooks/usePHIData.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

// PHI data interface for tracking access
interface PHIDataEntry<T> {
  data: T;
  accessedAt: Date;
  accessCount: number;
  sessionId: string;
  userId?: string;
}

// Global PHI data registry (in-memory only, cleared on refresh)
const phiDataRegistry = new Map<string, PHIDataEntry<any>>();

// Generate session ID for audit tracking
const generateSessionId = () => {
  return `phi-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Current session ID
let currentSessionId = generateSessionId();

// Clear all PHI data (for logout/session end)
export const clearAllPHIData = () => {
  phiDataRegistry.clear();
  currentSessionId = generateSessionId();
  console.log('[PHI] All PHI data cleared from memory');
};

// Auto-clear PHI data after inactivity
let inactivityTimer: NodeJS.Timeout | null = null;
const PHI_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    console.log('[PHI] Auto-clearing PHI data due to inactivity');
    clearAllPHIData();
  }, PHI_INACTIVITY_TIMEOUT);
};

// Track user activity for auto-clear
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  resetInactivityTimer();
}

// This hook stores PHI in memory only, never in persistent stores
export function usePHIData<T>(key: string, options?: {
  userId?: string;
  maxAccessCount?: number;
  ttl?: number; // Time to live in milliseconds
}) {
  const { userId, maxAccessCount = 1000, ttl = 60 * 60 * 1000 } = options || {}; // 1 hour default TTL
  const dataRef = useRef<T | null>(null);
  const [lastAccessed, setLastAccessed] = useState<Date | null>(null);
  const router = useRouter();

  // Generate unique key with session
  const fullKey = `${currentSessionId}:${key}`;

  const setPHIData = useCallback((data: T | null) => {
    if (data === null) {
      // Clear data
      dataRef.current = null;
      phiDataRegistry.delete(fullKey);
      console.log(`[PHI] Cleared data for key: ${key}`);
      return;
    }

    // Store in memory with metadata
    const entry: PHIDataEntry<T> = {
      data,
      accessedAt: new Date(),
      accessCount: 0,
      sessionId: currentSessionId,
      userId,
    };

    dataRef.current = data;
    phiDataRegistry.set(fullKey, entry);
    setLastAccessed(new Date());

    console.log(`[PHI] Stored data for key: ${key}`);

    // Reset inactivity timer on new data
    resetInactivityTimer();

    // Set TTL cleanup
    if (ttl > 0) {
      setTimeout(() => {
        if (phiDataRegistry.has(fullKey)) {
          console.log(`[PHI] Auto-expiring data for key: ${key} after ${ttl}ms`);
          setPHIData(null);
        }
      }, ttl);
    }
  }, [fullKey, key, userId, ttl]);

  const getPHIData = useCallback((): T | null => {
    const entry = phiDataRegistry.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check access count limit
    if (entry.accessCount >= maxAccessCount) {
      console.warn(`[PHI] Access limit exceeded for key: ${key}`);
      setPHIData(null);
      return null;
    }

    // Update access tracking
    entry.accessCount += 1;
    entry.accessedAt = new Date();
    setLastAccessed(new Date());

    // Reset inactivity timer on access
    resetInactivityTimer();

    return entry.data;
  }, [fullKey, key, maxAccessCount, setPHIData]);

  const getAccessInfo = useCallback(() => {
    const entry = phiDataRegistry.get(fullKey);
    if (!entry) return null;

    return {
      accessCount: entry.accessCount,
      lastAccessed: entry.accessedAt,
      sessionId: entry.sessionId,
      userId: entry.userId,
      hasData: !!entry.data,
    };
  }, [fullKey]);

  const clearPHIData = useCallback(() => {
    setPHIData(null);
  }, [setPHIData]);

  // Clear on unmount
  useEffect(() => {
    return () => {
      dataRef.current = null;
      console.log(`[PHI] Component unmounted, clearing ref for key: ${key}`);
    };
  }, [key]);

  // Clear on route change (Next.js)
  useEffect(() => {
    const handleRouteChange = () => {
      console.log(`[PHI] Route change detected, clearing data for key: ${key}`);
      clearPHIData();
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, key, clearPHIData]);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log(`[PHI] Page hidden, clearing data for key: ${key}`);
      clearPHIData();
    }
  };

  // Clear on page visibility change (tab switch, minimize)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      console.log('[PHI] Document not defined, skipping visibility change listener');
      return () => undefined;
    }
    // eslint-disable-next-line
  }, [key, clearPHIData]);

  const handleBeforeUnload = () => {
    console.log('[PHI] Page unloading, clearing all PHI data');
    clearAllPHIData();
  };

  // Clear on beforeunload (page refresh/close)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      console.log('[PHI] Window not defined, skipping beforeunload listener');
      return () => undefined;
    }
  }, []);

  return {
    setPHIData,
    getPHIData,
    clearPHIData,
    getAccessInfo,
    lastAccessed,
    hasData: !!dataRef.current,
  };
}

// Hook for managing multiple PHI data entries
export function usePHIDataManager() {
  const clearAll = useCallback(() => {
    clearAllPHIData();
  }, []);

  const getRegistry = useCallback(() => {
    const entries: Array<{
      key: string;
      accessCount: number;
      lastAccessed: Date;
      sessionId: string;
      userId?: string;
    }> = [];

    phiDataRegistry.forEach((entry, key) => {
      entries.push({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.accessedAt,
        sessionId: entry.sessionId,
        userId: entry.userId,
      });
    });

    return entries;
  }, []);

  const getStats = useCallback(() => {
    return {
      totalEntries: phiDataRegistry.size,
      currentSession: currentSessionId,
      registryKeys: Array.from(phiDataRegistry.keys()),
    };
  }, []);

  return {
    clearAll,
    getRegistry,
    getStats,
  };
}

// Types for common PHI data structures
export interface PatientPHI {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn?: string;
  email?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface ClaimPHI {
  id: string;
  patientId: number;
  diagnosis: string[];
  procedures: string[];
  totalAmount: number;
  serviceDate: string;
}

export interface EncounterPHI {
  id: string;
  patientId: number;
  clinicianId: number;
  encounterDate: string;
  notes?: string;
  vitals?: Record<string, any>;
}

// Usage examples with proper TypeScript support
export const usePHIDataExamples = () => {
  // Example 1: Patient data with user tracking
  const { setPHIData: setPatient, getPHIData: getPatient, clearPHIData: clearPatient } =
    usePHIData<PatientPHI>('current-patient', {
      userId: 'user-123',
      maxAccessCount: 50,
      ttl: 30 * 60 * 1000, // 30 minutes
    });

  // Example 2: Claim data with default settings
  const { setPHIData: setClaim, getPHIData: getClaim } =
    usePHIData<ClaimPHI>('current-claim');

  // Example 3: Encounter data with access info
  const {
    setPHIData: setEncounter,
    getPHIData: getEncounter,
    getAccessInfo: getEncounterAccessInfo,
    lastAccessed: encounterLastAccessed,
    hasData: hasEncounterData
  } = usePHIData<EncounterPHI>('current-encounter');

  return {
    patient: { setPatient, getPatient, clearPatient },
    claim: { setClaim, getClaim },
    encounter: {
      setEncounter,
      getEncounter,
      getEncounterAccessInfo,
      encounterLastAccessed,
      hasEncounterData
    },
  };
};

// Usage in components
/*
Example usage in a component:

function PatientDetails({ patientId }: { patientId: number }) {
  const { setPHIData, getPHIData, clearPHIData, getAccessInfo, hasData } =
    usePHIData<PatientPHI>('patient-details', {
      userId: getCurrentUserId(),
      maxAccessCount: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
    });

  const { clearAll, getStats } = usePHIDataManager();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patient = await fetchPatientById(patientId);
        setPHIData(patient);
      } catch (error) {
        console.error('Failed to fetch patient:', error);
      }
    };

    fetchPatientData();
  }, [patientId, setPHIData]);

  const patient = getPHIData();
  const accessInfo = getAccessInfo();

  const handleLogout = () => {
    clearAll(); // Clear all PHI data on logout
  };

  if (!hasData) {
    return <div>Loading patient data...</div>;
  }

  return (
    <div>
      <h1>{patient?.firstName} {patient?.lastName}</h1>
      <p>DOB: {patient?.dateOfBirth}</p>
      <p>Access count: {accessInfo?.accessCount}</p>
      <button onClick={clearPHIData}>Clear Patient Data</button>
      <button onClick={handleLogout}>Logout (Clear All)</button>
    </div>
  );
}
*/

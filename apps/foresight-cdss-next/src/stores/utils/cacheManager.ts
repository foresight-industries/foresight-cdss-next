import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/stores/mainStore";
import type { Tables } from "@/types/database.types";

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

// Cache manager class
export class CacheManager {
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000;

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      key,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys matching a pattern
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    return keys.filter((key) => pattern.test(key));
  }

  // Remove expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const expired = Array.from(this.cache.values()).filter(
      (entry) => now > entry.expiresAt
    );

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: expired.length,
      usage: (this.cache.size / this.maxSize) * 100,
    };
  }

  // Invalidate keys matching pattern
  invalidatePattern(pattern: RegExp): number {
    const keysToDelete = this.getKeys(pattern);
    for (const key of keysToDelete) this.cache.delete(key);
    return keysToDelete.length;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);

// Hook for caching data with automatic cache management
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    return enabled ? cacheManager.get<T>(key) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return;

      // Check cache first unless forcing
      if (!force && cacheManager.has(key)) {
        const cachedData = cacheManager.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          return cachedData;
        }
      }

      try {
        setLoading(true);
        setError(null);

        const result = await fetcher();

        // Cache the result
        cacheManager.set(key, result, ttl);
        setData(result);
        onSuccess?.(result);

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [key, fetcher, ttl, enabled, onSuccess, onError]
  );

  // Initial fetch
  useEffect(() => {
    if (enabled && (!fetchedRef.current || refetchOnMount)) {
      fetchData();
      fetchedRef.current = true;
    }
  }, [fetchData, enabled, refetchOnMount]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled) {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, refetchOnWindowFocus, enabled]);

  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
  }, [key]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const isStale = useMemo(() => {
    return !cacheManager.has(key);
  }, [key, data]); // Re-compute when data changes

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale,
  };
};

// Hook for caching store data
export const useStoreCache = () => {
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const setGlobalError = useAppStore((state) => state.setGlobalError);

  const cachePatients = useCallback(async () => {
    const patients = useAppStore.getState().patients;
    cacheManager.set("patients", patients, 10 * 60 * 1000); // 10 minutes
  }, []);

  const cacheClaims = useCallback(async () => {
    const claims = useAppStore.getState().claims;
    cacheManager.set("claims", claims, 5 * 60 * 1000); // 5 minutes
  }, []);

  const cachePriorAuths = useCallback(async () => {
    const priorAuths = useAppStore.getState().priorAuths;
    cacheManager.set("priorAuths", priorAuths, 5 * 60 * 1000);
  }, []);

  const loadFromCache = useCallback(
    (entityType: string) => {
      try {
        setGlobalLoading(true);

        const cachedData = cacheManager.get(entityType);
        if (cachedData) {
          const store = useAppStore.getState();

          switch (entityType) {
            case "patients":
              if (Array.isArray(cachedData)) {
                store.setPatients(cachedData as Tables<"patient">[]);
              }
              break;
            case "claims":
              if (Array.isArray(cachedData)) {
                store.setClaims(cachedData as Tables<"claim">[]);
              }
              break;
            case "priorAuths":
              if (Array.isArray(cachedData)) {
                store.setPriorAuths(cachedData as Tables<"prior_auth">[]);
              }
              break;
            // Add other entity types as needed
          }

          return true;
        }

        return false;
      } catch (error) {
        setGlobalError(
          error instanceof Error ? error.message : "Failed to load from cache"
        );
        return false;
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, setGlobalError]
  );

  const invalidateEntity = useCallback((entityType: string) => {
    cacheManager.delete(entityType);
  }, []);

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    return cacheManager.invalidatePattern(regex);
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  return {
    cachePatients,
    cacheClaims,
    cachePriorAuths,
    loadFromCache,
    invalidateEntity,
    invalidatePattern,
    getCacheStats,
  };
};

// Hook for entity-specific caching
export const useEntityCache = <T>(
  entityType: string,
  entityId: string | number,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  const cacheKey = `${entityType}:${entityId}`;

  return useCache(cacheKey, fetcher, {
    ttl,
    enabled,
    refetchOnMount: true,
  });
};

// Hook for patient-specific data caching
export const usePatientCache = (patientId: number) => {
  const fetchPatientProfile = useAppStore((state) => state.fetchPatientProfile);
  const fetchPatientDiagnoses = useAppStore(
    (state) => state.fetchPatientDiagnoses
  );
  const fetchPatientDocuments = useAppStore(
    (state) => state.fetchPatientDocuments
  );
  const fetchPatientAddress = useAppStore((state) => state.fetchPatientAddress);

  const {
    data: profile,
    loading: profileLoading,
    refetch: refetchProfile,
  } = useEntityCache(
    "patient_profile",
    patientId,
    () => fetchPatientProfile(patientId),
    { ttl: 10 * 60 * 1000 } // 10 minutes
  );

  const {
    data: diagnoses,
    loading: diagnosesLoading,
    refetch: refetchDiagnoses,
  } = useEntityCache(
    "patient_diagnoses",
    patientId,
    () => fetchPatientDiagnoses(patientId),
    { ttl: 15 * 60 * 1000 } // 15 minutes
  );

  const {
    data: documents,
    loading: documentsLoading,
    refetch: refetchDocuments,
  } = useEntityCache(
    "patient_documents",
    patientId,
    () => fetchPatientDocuments(patientId),
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );

  const {
    data: address,
    loading: addressLoading,
    refetch: refetchAddress,
  } = useEntityCache(
    "patient_address",
    patientId,
    () => fetchPatientAddress(patientId),
    { ttl: 30 * 60 * 1000 } // 30 minutes
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchProfile(),
      refetchDiagnoses(),
      refetchDocuments(),
      refetchAddress(),
    ]);
  }, [refetchProfile, refetchDiagnoses, refetchDocuments, refetchAddress]);

  const invalidateAll = useCallback(() => {
    cacheManager.invalidatePattern(new RegExp(`^patient_.*:${patientId}$`));
  }, [patientId]);

  return {
    profile,
    diagnoses,
    documents,
    address,
    loading: {
      profile: profileLoading,
      diagnoses: diagnosesLoading,
      documents: documentsLoading,
      address: addressLoading,
    },
    refetch: {
      profile: refetchProfile,
      diagnoses: refetchDiagnoses,
      documents: refetchDocuments,
      address: refetchAddress,
      all: refetchAll,
    },
    invalidateAll,
  };
};

// Hook for claim-specific data caching
export const useClaimCache = (claimId: string) => {
  const fetchClaimLines = useAppStore((state) => state.fetchClaimLines);
  const fetchClaimAttachments = useAppStore(
    (state) => state.fetchClaimAttachments
  );
  const fetchClaimValidations = useAppStore(
    (state) => state.fetchClaimValidations
  );
  const fetchScrubberResults = useAppStore(
    (state) => state.fetchScrubberResults
  );

  const {
    data: lines,
    loading: linesLoading,
    refetch: refetchLines,
  } = useEntityCache("claim_lines", claimId, () => fetchClaimLines(claimId), {
    ttl: 5 * 60 * 1000,
  });

  const {
    data: attachments,
    loading: attachmentsLoading,
    refetch: refetchAttachments,
  } = useEntityCache(
    "claim_attachments",
    claimId,
    () => fetchClaimAttachments(claimId),
    { ttl: 10 * 60 * 1000 }
  );

  const {
    data: validations,
    loading: validationsLoading,
    refetch: refetchValidations,
  } = useEntityCache(
    "claim_validations",
    claimId,
    () => fetchClaimValidations(claimId),
    { ttl: 3 * 60 * 1000 }
  );

  const {
    data: scrubberResults,
    loading: scrubberLoading,
    refetch: refetchScrubber,
  } = useEntityCache(
    "scrubber_results",
    claimId,
    () => fetchScrubberResults(claimId),
    { ttl: 2 * 60 * 1000 }
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchLines(),
      refetchAttachments(),
      refetchValidations(),
      refetchScrubber(),
    ]);
  }, [refetchLines, refetchAttachments, refetchValidations, refetchScrubber]);

  const invalidateAll = useCallback(() => {
    cacheManager.invalidatePattern(new RegExp(`^claim_.*:${claimId}$`));
  }, [claimId]);

  return {
    lines,
    attachments,
    validations,
    scrubberResults,
    loading: {
      lines: linesLoading,
      attachments: attachmentsLoading,
      validations: validationsLoading,
      scrubber: scrubberLoading,
    },
    refetch: {
      lines: refetchLines,
      attachments: refetchAttachments,
      validations: refetchValidations,
      scrubber: refetchScrubber,
      all: refetchAll,
    },
    invalidateAll,
  };
};

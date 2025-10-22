import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../mainStore";

// Generic pagination utility
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const usePagination = (data: any[], initialPageSize = 20) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, page, pageSize]);

  const pagination: PaginationState = useMemo(
    () => ({
      page,
      pageSize,
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize),
    }),
    [data.length, page, pageSize]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, pagination.totalPages)));
    },
    [pagination.totalPages]
  );

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(
    () => goToPage(pagination.totalPages),
    [goToPage, pagination.totalPages]
  );
  const goToNextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const goToPreviousPage = useCallback(
    () => goToPage(page - 1),
    [goToPage, page]
  );

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  return {
    data: paginatedData,
    pagination,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
  };
};

// Generic sorting utility
export type SortDirection = "asc" | "desc";
export interface SortState {
  field: string | null;
  direction: SortDirection;
}

export const useSorting = <T extends Record<string, any>>(
  data: T[],
  initialSort?: { field: keyof T; direction: SortDirection }
) => {
  const [sortState, setSortState] = useState<SortState>({
    field: (initialSort?.field as string) || null,
    direction: initialSort?.direction || "asc",
  });

  const sortedData = useMemo(() => {
    if (!sortState.field) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortState.field!];
      const bValue = b[sortState.field!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        const result = aValue.localeCompare(bValue);
        return sortState.direction === "asc" ? result : -result;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        const result = aValue - bValue;
        return sortState.direction === "asc" ? result : -result;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const result = aValue.getTime() - bValue.getTime();
        return sortState.direction === "asc" ? result : -result;
      }

      // Convert to strings for comparison
      const result = String(aValue).localeCompare(String(bValue));
      return sortState.direction === "asc" ? result : -result;
    });
  }, [data, sortState]);

  const sort = useCallback((field: string) => {
    setSortState((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const clearSort = useCallback(() => {
    setSortState({ field: null, direction: "asc" });
  }, []);

  return {
    data: sortedData,
    sortState,
    sort,
    clearSort,
  };
};

// Generic filtering utility
export const useFiltering = <T extends Record<string, any>>(
  data: T[],
  filters: Record<string, any>
) => {
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value == null || value === "" || value === undefined) return true;

        const itemValue = item[key];

        // Handle array filters (e.g., status in ['active', 'pending'])
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(itemValue);
        }

        // Handle string filters (case-insensitive contains)
        if (typeof value === "string" && typeof itemValue === "string") {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }

        // Handle boolean filters
        if (typeof value === "boolean") {
          return itemValue === value;
        }

        // Handle number filters
        if (typeof value === "number") {
          return itemValue === value;
        }

        // Handle date range filters
        if (typeof value === "object" && value.from && value.to) {
          const itemDate = new Date(itemValue);
          return (
            itemDate >= new Date(value.from) && itemDate <= new Date(value.to)
          );
        }

        // Default exact match
        return itemValue === value;
      });
    });
  }, [data, filters]);

  return filteredData;
};

// Search utility
export const useSearch = <T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
) => {
  const searchedData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowercaseSearch = searchTerm.toLowerCase();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercaseSearch);
      });
    });
  }, [data, searchTerm, searchFields]);

  return searchedData;
};

// Combined data processing hook
export const useDataProcessing = <T extends Record<string, any>>(
  data: T[],
  options: {
    filters?: Record<string, any>;
    searchTerm?: string;
    searchFields?: (keyof T)[];
    sortField?: keyof T;
    sortDirection?: SortDirection;
    pageSize?: number;
  } = {}
) => {
  const {
    filters = {},
    searchTerm = "",
    searchFields = [],
    sortField,
    sortDirection = "asc",
    pageSize = 20,
  } = options;

  // Apply filters
  const filteredData = useFiltering(data, filters);

  // Apply search
  const searchedData = useSearch(filteredData, searchTerm, searchFields);

  // Apply sorting
  const {
    data: sortedData,
    sort,
    sortState,
    clearSort,
  } = useSorting(
    searchedData,
    sortField ? { field: sortField, direction: sortDirection } : undefined
  );

  // Apply pagination
  const {
    data: paginatedData,
    pagination,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
  } = usePagination(sortedData, pageSize);

  return {
    data: paginatedData,
    totalData: searchedData,
    pagination,
    sortState,
    sort,
    clearSort,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
  };
};

// Store synchronization utility
export const useStoreSync = (
  entityType: string,
  entityId?: string | number
) => {
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const setGlobalError = useAppStore((state) => state.setGlobalError);

  const syncEntity = useCallback(async () => {
    try {
      setGlobalLoading(true);
      setGlobalError(null);

      // Fetch entity data based on type
      switch (entityType) {
        case "patients":
          await useAppStore.getState().fetchPatients();
          break;
        case "claims":
          await useAppStore.getState().fetchClaims();
          break;
        case "prior-auths":
          await useAppStore.getState().fetchPriorAuths();
          break;
        case "payments":
          await useAppStore.getState().fetchPaymentDetails();
          break;
        case "providers":
          await useAppStore.getState().fetchClinicians();
          break;
        case "payers":
          await useAppStore.getState().fetchPayers();
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setGlobalLoading(false);
    }
  }, [entityType, setGlobalLoading, setGlobalError]);

  // Auto-sync on mount
  useEffect(() => {
    syncEntity();
  }, [syncEntity]);

  return { syncEntity };
};

// Entity relationship utilities
export const useEntityRelationships = () => {
  const patients = useAppStore((state) => state.patients);
  const claims = useAppStore((state) => state.claims);
  const priorAuths = useAppStore((state) => state.priorAuths);
  const clinicians = useAppStore((state) => state.clinicians);
  const payers = useAppStore((state) => state.payers);

  const getPatientClaims = useCallback(
    (patientId: string) => {
      return claims.filter((claim) => claim.patientId === patientId);
    },
    [claims]
  );

  const getPatientPriorAuths = useCallback(
    (patientId: string) => {
      return priorAuths.filter((pa) => pa.patientId === patientId);
    },
    [priorAuths]
  );

  const getClaimProvider = useCallback(
    (claimId: string) => {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return null;

      // Get the billing provider from the claim
      return (
        clinicians.find((p) => p.id === claim.billingProviderId) ||
        null
      );
    },
    [claims, clinicians]
  );

  const getClaimPayer = useCallback(
    (claimId: string) => {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return null;
      return payers.find((p) => p.id === claim.payerId) || null;
    },
    [claims, payers]
  );

  const getPatientByName = useCallback(
    (firstName: string, lastName: string) => {
      return patients.find((patient) => {
        return (
          patient.firstName?.toLowerCase() === firstName.toLowerCase() &&
          patient.lastName?.toLowerCase() === lastName.toLowerCase()
        );
      });
    },
    [patients]
  );

  const getPayerClaims = useCallback(
    (payerId: string) => {
      return claims.filter((claim) => claim.payerId === payerId);
    },
    [claims]
  );

  const getProviderClaims = useCallback(
    (providerId: string) => {
      return claims.filter((claim) => claim.billingProviderId === providerId);
    },
    [claims]
  );

  return {
    getPatientClaims,
    getPatientPriorAuths,
    getClaimProvider,
    getClaimPayer,
    getPatientByName,
    getPayerClaims,
    getProviderClaims,
  };
};

// Validation utility
export const useValidation = () => {
  const validatePatientProfile = useCallback(
    (patientProfile: Partial<{
      firstName?: string;
      lastName?: string;
      dateOfBirth?: Date;
      email?: string;
    }>) => {
      const errors: Record<string, string> = {};

      if (!patientProfile.firstName?.trim()) {
        errors.firstName = "First name is required";
      }

      if (!patientProfile.lastName?.trim()) {
        errors.lastName = "Last name is required";
      }

      if (!patientProfile.dateOfBirth) {
        errors.dateOfBirth = "Date of birth is required";
      }

      if (
        patientProfile.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientProfile.email)
      ) {
        errors.email = "Invalid email format";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    []
  );

  const validateClaim = useCallback((claim: Partial<{
    encounterId?: string;
    payerId?: string;
    totalAmount?: number;
  }>) => {
    const errors: Record<string, string> = {};

    if (!claim.encounterId) {
      errors.encounterId = "Encounter is required";
    }

    if (!claim.payerId) {
      errors.payerId = "Payer is required";
    }

    if (!claim.totalAmount || claim.totalAmount <= 0) {
      errors.totalAmount = "Valid total amount is required";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return {
    validatePatientProfile,
    validateClaim,
  };
};

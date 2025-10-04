export const queryKeys = {
  claims: {
    all: ["claims"] as const,
    list: (filters?: ClaimFilters) => ["claims", "list", filters] as const,
    detail: (id: string) => ["claims", "detail", id] as const,
    validation: (id: string) => ["claims", "validation", id] as const,
  },
  priorAuth: {
    all: ["priorAuth"] as const,
    list: (filters?: PAFilters) => ["priorAuth", "list", filters] as const,
    detail: (id: string) => ["priorAuth", "detail", id] as const,
    pipeline: () => ["priorAuth", "pipeline"] as const,
  },
  patients: {
    all: ["patients"] as const,
    detail: (id: number) => ["patients", "detail", id] as const,
    financials: (id: number) => ["patients", "financials", id] as const,
    eligibility: (id: number) => ["patients", "eligibility", id] as const,
  },
  workQueue: {
    all: ["workQueue"] as const,
    assigned: (userId: string) => ["workQueue", "assigned", userId] as const,
    summary: () => ["workQueue", "summary"] as const,
  },
} as const;

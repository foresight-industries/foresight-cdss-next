import { StateCreator } from "zustand";

// AWS-compatible types
type PaymentDetail = {
  id: string;
  organizationId: string;
  claimId?: string;
  payerId: string;
  patientId?: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  checkNumber?: string;
  referenceNumber?: string;
  paymentType: 'copay' | 'deductible' | 'coinsurance' | 'patient' | 'insurance' | 'other';
  status: 'pending' | 'posted' | 'processed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentAdjustment = {
  id: string;
  organizationId: string;
  paymentDetailId: string;
  adjustmentType: string;
  adjustmentAmount: number;
  reasonCode?: string;
  description?: string;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentPlan = {
  id: string;
  organizationId: string;
  patientId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  interestRate?: number;
  setupFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentPostingSession = {
  id: string;
  organizationId: string;
  sessionName: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'cancelled';
  totalPayments: number;
  totalAmount: number;
  userId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentReconciliation = {
  id: string;
  organizationId: string;
  paymentDetailId: string;
  expectedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  reconciliationDate: Date;
  status: 'matched' | 'variance' | 'unmatched';
  notes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentVariance = {
  id: string;
  organizationId: string;
  paymentDetailId: string;
  varianceType: string;
  varianceAmount: number;
  expectedAmount: number;
  actualAmount: number;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reviewedAt?: Date;
  reviewedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreditBalance = {
  id: string;
  organizationId: string;
  patientId: string;
  currentBalance: number;
  availableBalance: number;
  lastActivityDate: Date;
  status: 'active' | 'expired' | 'transferred';
  expirationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type RemittanceAdvice = {
  id: string;
  organizationId: string;
  payerId: string;
  remittanceNumber: string;
  paymentDate: Date;
  totalAmount: number;
  fileFormat: string;
  fileName?: string;
  fileUrl?: string;
  status: 'pending' | 'processed' | 'error';
  processedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ERALineDetail = {
  id: string;
  organizationId: string;
  remittanceAdviceId: string;
  claimId?: string;
  lineNumber: number;
  serviceDate: Date;
  procedureCode: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  adjustmentAmount: number;
  reasonCodes?: string[];
  remarkCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export interface PaymentSlice {
  // State
  paymentDetails: PaymentDetail[];
  paymentAdjustments: PaymentAdjustment[];
  paymentPlans: PaymentPlan[];
  paymentPostingSessions: PaymentPostingSession[];
  paymentReconciliations: PaymentReconciliation[];
  paymentVariances: PaymentVariance[];
  creditBalances: CreditBalance[];
  remittanceAdvices: RemittanceAdvice[];
  eraLineDetails: ERALineDetail[];

  // Selected items
  selectedPaymentDetail: PaymentDetail | null;
  selectedRemittanceAdvice: RemittanceAdvice | null;
  selectedPaymentPlan: PaymentPlan | null;

  // Loading states
  paymentDetailsLoading: boolean;
  paymentAdjustmentsLoading: boolean;
  paymentPlansLoading: boolean;
  paymentPostingSessionsLoading: boolean;
  paymentReconciliationsLoading: boolean;
  remittanceAdvicesLoading: boolean;

  // Error states
  paymentDetailsError: string | null;
  paymentAdjustmentsError: string | null;
  paymentPlansError: string | null;

  // Filter state
  paymentFilters: {
    dateRange?:
      | "today"
      | "last_7_days"
      | "last_30_days"
      | "last_90_days"
      | "custom";
    customDateRange?: { from: Date; to: Date };
    payerId?: string;
    patientId?: string;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
    status?: string[];
  };

  // Actions
  setPaymentDetails: (details: PaymentDetail[]) => void;
  setSelectedPaymentDetail: (detail: PaymentDetail | null) => void;
  addPaymentDetail: (detail: PaymentDetail) => void;
  updatePaymentDetail: (
    id: string,
    updates: Partial<PaymentDetail>
  ) => void;
  removePaymentDetail: (id: string) => void;

  // Payment adjustments actions
  setPaymentAdjustments: (adjustments: PaymentAdjustment[]) => void;
  addPaymentAdjustment: (adjustment: PaymentAdjustment) => void;
  updatePaymentAdjustment: (
    id: string,
    updates: Partial<PaymentAdjustment>
  ) => void;
  removePaymentAdjustment: (id: string) => void;

  // Payment plans actions
  setPaymentPlans: (plans: PaymentPlan[]) => void;
  setSelectedPaymentPlan: (plan: PaymentPlan | null) => void;
  addPaymentPlan: (plan: PaymentPlan) => void;
  updatePaymentPlan: (
    id: string,
    updates: Partial<PaymentPlan>
  ) => void;
  removePaymentPlan: (id: string) => void;

  // Payment posting sessions actions
  setPaymentPostingSessions: (
    sessions: PaymentPostingSession[]
  ) => void;
  addPaymentPostingSession: (
    session: PaymentPostingSession
  ) => void;
  updatePaymentPostingSession: (
    id: string,
    updates: Partial<PaymentPostingSession>
  ) => void;

  // Payment reconciliations actions
  setPaymentReconciliations: (
    reconciliations: PaymentReconciliation[]
  ) => void;
  addPaymentReconciliation: (
    reconciliation: PaymentReconciliation
  ) => void;
  updatePaymentReconciliation: (
    id: string,
    updates: Partial<PaymentReconciliation>
  ) => void;

  // Payment variances actions
  setPaymentVariances: (variances: PaymentVariance[]) => void;
  addPaymentVariance: (variance: PaymentVariance) => void;
  updatePaymentVariance: (
    id: string,
    updates: Partial<PaymentVariance>
  ) => void;

  // Credit balances actions
  setCreditBalances: (balances: CreditBalance[]) => void;
  addCreditBalance: (balance: CreditBalance) => void;
  updateCreditBalance: (
    id: string,
    updates: Partial<CreditBalance>
  ) => void;

  // Remittance advice actions
  setRemittanceAdvices: (advices: RemittanceAdvice[]) => void;
  setSelectedRemittanceAdvice: (
    advice: RemittanceAdvice | null
  ) => void;
  addRemittanceAdvice: (advice: RemittanceAdvice) => void;
  updateRemittanceAdvice: (
    id: string,
    updates: Partial<RemittanceAdvice>
  ) => void;

  // ERA line details actions
  setERALineDetails: (details: ERALineDetail[]) => void;
  addERALineDetail: (detail: ERALineDetail) => void;
  updateERALineDetail: (
    id: string,
    updates: Partial<ERALineDetail>
  ) => void;

  // Filter actions
  setPaymentFilters: (filters: PaymentSlice["paymentFilters"]) => void;
  clearPaymentFilters: () => void;

  // Async actions
  fetchPaymentDetails: () => Promise<void>;
  fetchPaymentAdjustments: () => Promise<void>;
  fetchPaymentPlans: () => Promise<void>;
  fetchPaymentPostingSessions: () => Promise<void>;
  fetchPaymentReconciliations: () => Promise<void>;
  fetchPaymentVariances: () => Promise<void>;
  fetchCreditBalances: () => Promise<void>;
  fetchRemittanceAdvices: () => Promise<void>;
  fetchERALineDetails: (remittanceId: string) => Promise<void>;
  postPayment: (paymentData: any) => Promise<void>;
  reconcilePayment: (
    paymentId: string,
    reconciliationData: any
  ) => Promise<void>;
}

export const createPaymentSlice: StateCreator<
  PaymentSlice,
  [],
  [],
  PaymentSlice
> = (set, get) => ({
  // Initial state
  paymentDetails: [],
  paymentAdjustments: [],
  paymentPlans: [],
  paymentPostingSessions: [],
  paymentReconciliations: [],
  paymentVariances: [],
  creditBalances: [],
  remittanceAdvices: [],
  eraLineDetails: [],

  // Selected items
  selectedPaymentDetail: null,
  selectedRemittanceAdvice: null,
  selectedPaymentPlan: null,

  // Loading states
  paymentDetailsLoading: false,
  paymentAdjustmentsLoading: false,
  paymentPlansLoading: false,
  paymentPostingSessionsLoading: false,
  paymentReconciliationsLoading: false,
  remittanceAdvicesLoading: false,

  // Error states
  paymentDetailsError: null,
  paymentAdjustmentsError: null,
  paymentPlansError: null,

  // Filter state
  paymentFilters: {
    dateRange: "last_30_days",
  },

  // Payment details actions
  setPaymentDetails: (details) => set({ paymentDetails: details }),
  setSelectedPaymentDetail: (detail) => set({ selectedPaymentDetail: detail }),

  addPaymentDetail: (detail) =>
    set((state) => ({
      paymentDetails: [...state.paymentDetails, detail],
    })),

  updatePaymentDetail: (id, updates) =>
    set((state) => ({
      paymentDetails: state.paymentDetails.map((pd) =>
        pd.id === id ? { ...pd, ...updates } : pd
      ),
      selectedPaymentDetail:
        state.selectedPaymentDetail?.id === id
          ? { ...state.selectedPaymentDetail, ...updates }
          : state.selectedPaymentDetail,
    })),

  removePaymentDetail: (id) =>
    set((state) => ({
      paymentDetails: state.paymentDetails.filter((pd) => pd.id !== id),
      selectedPaymentDetail:
        state.selectedPaymentDetail?.id === id
          ? null
          : state.selectedPaymentDetail,
    })),

  // Payment adjustments actions
  setPaymentAdjustments: (adjustments) =>
    set({ paymentAdjustments: adjustments }),

  addPaymentAdjustment: (adjustment) =>
    set((state) => ({
      paymentAdjustments: [...state.paymentAdjustments, adjustment],
    })),

  updatePaymentAdjustment: (id, updates) =>
    set((state) => ({
      paymentAdjustments: state.paymentAdjustments.map((pa) =>
        pa.id === id ? { ...pa, ...updates } : pa
      ),
    })),

  removePaymentAdjustment: (id) =>
    set((state) => ({
      paymentAdjustments: state.paymentAdjustments.filter((pa) => pa.id !== id),
    })),

  // Payment plans actions
  setPaymentPlans: (plans) => set({ paymentPlans: plans }),
  setSelectedPaymentPlan: (plan) => set({ selectedPaymentPlan: plan }),

  addPaymentPlan: (plan) =>
    set((state) => ({
      paymentPlans: [...state.paymentPlans, plan],
    })),

  updatePaymentPlan: (id, updates) =>
    set((state) => ({
      paymentPlans: state.paymentPlans.map((pp) =>
        pp.id === id ? { ...pp, ...updates } : pp
      ),
      selectedPaymentPlan:
        state.selectedPaymentPlan?.id === id
          ? { ...state.selectedPaymentPlan, ...updates }
          : state.selectedPaymentPlan,
    })),

  removePaymentPlan: (id) =>
    set((state) => ({
      paymentPlans: state.paymentPlans.filter((pp) => pp.id !== id),
      selectedPaymentPlan:
        state.selectedPaymentPlan?.id === id ? null : state.selectedPaymentPlan,
    })),

  // Payment posting sessions actions
  setPaymentPostingSessions: (sessions) =>
    set({ paymentPostingSessions: sessions }),

  addPaymentPostingSession: (session) =>
    set((state) => ({
      paymentPostingSessions: [...state.paymentPostingSessions, session],
    })),

  updatePaymentPostingSession: (id, updates) =>
    set((state) => ({
      paymentPostingSessions: state.paymentPostingSessions.map((pps) =>
        pps.id === id ? { ...pps, ...updates } : pps
      ),
    })),

  // Payment reconciliations actions
  setPaymentReconciliations: (reconciliations) =>
    set({ paymentReconciliations: reconciliations }),

  addPaymentReconciliation: (reconciliation) =>
    set((state) => ({
      paymentReconciliations: [...state.paymentReconciliations, reconciliation],
    })),

  updatePaymentReconciliation: (id, updates) =>
    set((state) => ({
      paymentReconciliations: state.paymentReconciliations.map((pr) =>
        pr.id === id ? { ...pr, ...updates } : pr
      ),
    })),

  // Payment variances actions
  setPaymentVariances: (variances) => set({ paymentVariances: variances }),

  addPaymentVariance: (variance) =>
    set((state) => ({
      paymentVariances: [...state.paymentVariances, variance],
    })),

  updatePaymentVariance: (id, updates) =>
    set((state) => ({
      paymentVariances: state.paymentVariances.map((pv) =>
        pv.id === id ? { ...pv, ...updates } : pv
      ),
    })),

  // Credit balances actions
  setCreditBalances: (balances) => set({ creditBalances: balances }),

  addCreditBalance: (balance) =>
    set((state) => ({
      creditBalances: [...state.creditBalances, balance],
    })),

  updateCreditBalance: (id, updates) =>
    set((state) => ({
      creditBalances: state.creditBalances.map((cb) =>
        cb.id === id ? { ...cb, ...updates } : cb
      ),
    })),

  // Remittance advice actions
  setRemittanceAdvices: (advices) => set({ remittanceAdvices: advices }),
  setSelectedRemittanceAdvice: (advice) =>
    set({ selectedRemittanceAdvice: advice }),

  addRemittanceAdvice: (advice) =>
    set((state) => ({
      remittanceAdvices: [...state.remittanceAdvices, advice],
    })),

  updateRemittanceAdvice: (id, updates) =>
    set((state) => ({
      remittanceAdvices: state.remittanceAdvices.map((ra) =>
        ra.id === id ? { ...ra, ...updates } : ra
      ),
      selectedRemittanceAdvice:
        state.selectedRemittanceAdvice?.id === id
          ? { ...state.selectedRemittanceAdvice, ...updates }
          : state.selectedRemittanceAdvice,
    })),

  // ERA line details actions
  setERALineDetails: (details) => set({ eraLineDetails: details }),

  addERALineDetail: (detail) =>
    set((state) => ({
      eraLineDetails: [...state.eraLineDetails, detail],
    })),

  updateERALineDetail: (id, updates) =>
    set((state) => ({
      eraLineDetails: state.eraLineDetails.map((eld) =>
        eld.id === id ? { ...eld, ...updates } : eld
      ),
    })),

  // Filter actions
  setPaymentFilters: (filters) =>
    set((state) => ({
      paymentFilters: { ...state.paymentFilters, ...filters },
    })),

  clearPaymentFilters: () =>
    set({
      paymentFilters: {
        dateRange: "last_30_days",
      },
    }),

  // Async actions
  fetchPaymentDetails: async () => {
    set({ paymentDetailsLoading: true, paymentDetailsError: null });
    try {
      const response = await fetch('/api/payments/details');
      if (!response.ok) throw new Error('Failed to fetch payment details');
      
      const data = await response.json();
      set({ paymentDetails: data.paymentDetails || [], paymentDetailsLoading: false });
    } catch (error) {
      set({
        paymentDetailsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment details",
        paymentDetailsLoading: false,
      });
    }
  },

  fetchPaymentAdjustments: async () => {
    set({ paymentAdjustmentsLoading: true, paymentAdjustmentsError: null });
    try {
      const response = await fetch('/api/payments/adjustments');
      if (!response.ok) throw new Error('Failed to fetch payment adjustments');
      
      const data = await response.json();
      set({ paymentAdjustments: data.paymentAdjustments || [], paymentAdjustmentsLoading: false });
    } catch (error) {
      set({
        paymentAdjustmentsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment adjustments",
        paymentAdjustmentsLoading: false,
      });
    }
  },

  fetchPaymentPlans: async () => {
    set({ paymentPlansLoading: true, paymentPlansError: null });
    try {
      const response = await fetch('/api/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch payment plans');
      
      const data = await response.json();
      set({ paymentPlans: data.paymentPlans || [], paymentPlansLoading: false });
    } catch (error) {
      set({
        paymentPlansError:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment plans",
        paymentPlansLoading: false,
      });
    }
  },

  fetchPaymentPostingSessions: async () => {
    set({ paymentPostingSessionsLoading: true });
    try {
      const response = await fetch('/api/payments/posting-sessions');
      if (!response.ok) throw new Error('Failed to fetch payment posting sessions');
      
      const data = await response.json();
      set({
        paymentPostingSessions: data.paymentPostingSessions || [],
        paymentPostingSessionsLoading: false,
      });
    } catch (error) {
      set({ paymentPostingSessionsLoading: false });
      console.error("Failed to fetch payment posting sessions:", error);
    }
  },

  fetchPaymentReconciliations: async () => {
    set({ paymentReconciliationsLoading: true });
    try {
      const response = await fetch('/api/payments/reconciliations');
      if (!response.ok) throw new Error('Failed to fetch payment reconciliations');
      
      const data = await response.json();
      set({
        paymentReconciliations: data.paymentReconciliations || [],
        paymentReconciliationsLoading: false,
      });
    } catch (error) {
      set({ paymentReconciliationsLoading: false });
      console.error("Failed to fetch payment reconciliations:", error);
    }
  },

  fetchPaymentVariances: async () => {
    try {
      const response = await fetch('/api/payments/variances');
      if (!response.ok) throw new Error('Failed to fetch payment variances');
      
      const data = await response.json();
      set({ paymentVariances: data.paymentVariances || [] });
    } catch (error) {
      console.error("Failed to fetch payment variances:", error);
    }
  },

  fetchCreditBalances: async () => {
    try {
      const response = await fetch('/api/payments/credit-balances');
      if (!response.ok) throw new Error('Failed to fetch credit balances');
      
      const data = await response.json();
      set({ creditBalances: data.creditBalances || [] });
    } catch (error) {
      console.error("Failed to fetch credit balances:", error);
    }
  },

  fetchRemittanceAdvices: async () => {
    set({ remittanceAdvicesLoading: true });
    try {
      const response = await fetch('/api/payments/remittance-advices');
      if (!response.ok) throw new Error('Failed to fetch remittance advices');
      
      const data = await response.json();
      set({ remittanceAdvices: data.remittanceAdvices || [], remittanceAdvicesLoading: false });
    } catch (error) {
      set({ remittanceAdvicesLoading: false });
      console.error("Failed to fetch remittance advices:", error);
    }
  },

  fetchERALineDetails: async (remittanceId) => {
    try {
      const response = await fetch(`/api/payments/remittance-advices/${remittanceId}/era-line-details`);
      if (!response.ok) throw new Error('Failed to fetch ERA line details');
      
      const data = await response.json();
      set({ eraLineDetails: data.eraLineDetails || [] });
    } catch (error) {
      console.error("Failed to fetch ERA line details:", error);
    }
  },

  postPayment: async (paymentData) => {
    try {
      const response = await fetch('/api/payments/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error('Failed to post payment');
      
      const data = await response.json();
      if (data.paymentDetail) {
        get().addPaymentDetail(data.paymentDetail);
      }
    } catch (error) {
      console.error("Failed to post payment:", error);
      throw error;
    }
  },

  reconcilePayment: async (paymentId, reconciliationData) => {
    try {
      const response = await fetch(`/api/payments/details/${paymentId}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reconciliationData),
      });

      if (!response.ok) throw new Error('Failed to reconcile payment');
      
      const data = await response.json();
      if (data.paymentReconciliation) {
        get().addPaymentReconciliation(data.paymentReconciliation);
      }

      // Update payment detail status
      get().updatePaymentDetail(paymentId, { status: "processed" });
    } catch (error) {
      console.error("Failed to reconcile payment:", error);
      throw error;
    }
  },
});

import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface PaymentSlice {
  // State
  paymentDetails: Tables<"payment_detail">[];
  paymentAdjustments: Tables<"payment_adjustment">[];
  paymentPlans: Tables<"payment_plan">[];
  paymentPostingSessions: Tables<"payment_posting_session">[];
  paymentReconciliations: Tables<"payment_reconciliation">[];
  paymentVariances: Tables<"payment_variance">[];
  creditBalances: Tables<"credit_balance">[];
  remittanceAdvices: Tables<"remittance_advice">[];
  eraLineDetails: Tables<"era_line_detail">[];

  // Selected items
  selectedPaymentDetail: Tables<"payment_detail"> | null;
  selectedRemittanceAdvice: Tables<"remittance_advice"> | null;
  selectedPaymentPlan: Tables<"payment_plan"> | null;

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
    payerId?: number;
    patientId?: number;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
    status?: string[];
  };

  // Actions
  setPaymentDetails: (details: Tables<"payment_detail">[]) => void;
  setSelectedPaymentDetail: (detail: Tables<"payment_detail"> | null) => void;
  addPaymentDetail: (detail: Tables<"payment_detail">) => void;
  updatePaymentDetail: (
    id: string,
    updates: Partial<Tables<"payment_detail">>
  ) => void;
  removePaymentDetail: (id: string) => void;

  // Payment adjustments actions
  setPaymentAdjustments: (adjustments: Tables<"payment_adjustment">[]) => void;
  addPaymentAdjustment: (adjustment: Tables<"payment_adjustment">) => void;
  updatePaymentAdjustment: (
    id: string,
    updates: Partial<Tables<"payment_adjustment">>
  ) => void;
  removePaymentAdjustment: (id: string) => void;

  // Payment plans actions
  setPaymentPlans: (plans: Tables<"payment_plan">[]) => void;
  setSelectedPaymentPlan: (plan: Tables<"payment_plan"> | null) => void;
  addPaymentPlan: (plan: Tables<"payment_plan">) => void;
  updatePaymentPlan: (
    id: string,
    updates: Partial<Tables<"payment_plan">>
  ) => void;
  removePaymentPlan: (id: string) => void;

  // Payment posting sessions actions
  setPaymentPostingSessions: (
    sessions: Tables<"payment_posting_session">[]
  ) => void;
  addPaymentPostingSession: (
    session: Tables<"payment_posting_session">
  ) => void;
  updatePaymentPostingSession: (
    id: string,
    updates: Partial<Tables<"payment_posting_session">>
  ) => void;

  // Payment reconciliations actions
  setPaymentReconciliations: (
    reconciliations: Tables<"payment_reconciliation">[]
  ) => void;
  addPaymentReconciliation: (
    reconciliation: Tables<"payment_reconciliation">
  ) => void;
  updatePaymentReconciliation: (
    id: string,
    updates: Partial<Tables<"payment_reconciliation">>
  ) => void;

  // Payment variances actions
  setPaymentVariances: (variances: Tables<"payment_variance">[]) => void;
  addPaymentVariance: (variance: Tables<"payment_variance">) => void;
  updatePaymentVariance: (
    id: string,
    updates: Partial<Tables<"payment_variance">>
  ) => void;

  // Credit balances actions
  setCreditBalances: (balances: Tables<"credit_balance">[]) => void;
  addCreditBalance: (balance: Tables<"credit_balance">) => void;
  updateCreditBalance: (
    id: string,
    updates: Partial<Tables<"credit_balance">>
  ) => void;

  // Remittance advice actions
  setRemittanceAdvices: (advices: Tables<"remittance_advice">[]) => void;
  setSelectedRemittanceAdvice: (
    advice: Tables<"remittance_advice"> | null
  ) => void;
  addRemittanceAdvice: (advice: Tables<"remittance_advice">) => void;
  updateRemittanceAdvice: (
    id: string,
    updates: Partial<Tables<"remittance_advice">>
  ) => void;

  // ERA line details actions
  setERALineDetails: (details: Tables<"era_line_detail">[]) => void;
  addERALineDetail: (detail: Tables<"era_line_detail">) => void;
  updateERALineDetail: (
    id: string,
    updates: Partial<Tables<"era_line_detail">>
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
      const { data, error } = await supabase
        .from("payment_detail")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ paymentDetails: data || [], paymentDetailsLoading: false });
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
      const { data, error } = await supabase
        .from("payment_adjustment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ paymentAdjustments: data || [], paymentAdjustmentsLoading: false });
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
      const { data, error } = await supabase
        .from("payment_plan")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ paymentPlans: data || [], paymentPlansLoading: false });
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
      const { data, error } = await supabase
        .from("payment_posting_session")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({
        paymentPostingSessions: data || [],
        paymentPostingSessionsLoading: false,
      });
    } catch (error) {
      set({ paymentPostingSessionsLoading: false });
    }
  },

  fetchPaymentReconciliations: async () => {
    set({ paymentReconciliationsLoading: true });
    try {
      const { data, error } = await supabase
        .from("payment_reconciliation")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({
        paymentReconciliations: data || [],
        paymentReconciliationsLoading: false,
      });
    } catch (error) {
      set({ paymentReconciliationsLoading: false });
    }
  },

  fetchPaymentVariances: async () => {
    try {
      const { data, error } = await supabase
        .from("payment_variance")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ paymentVariances: data || [] });
    } catch (error) {
      console.error("Failed to fetch payment variances:", error);
    }
  },

  fetchCreditBalances: async () => {
    try {
      const { data, error } = await supabase
        .from("credit_balance")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ creditBalances: data || [] });
    } catch (error) {
      console.error("Failed to fetch credit balances:", error);
    }
  },

  fetchRemittanceAdvices: async () => {
    set({ remittanceAdvicesLoading: true });
    try {
      const { data, error } = await supabase
        .from("remittance_advice")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ remittanceAdvices: data || [], remittanceAdvicesLoading: false });
    } catch (error) {
      set({ remittanceAdvicesLoading: false });
    }
  },

  fetchERALineDetails: async (remittanceId) => {
    try {
      const { data, error } = await supabase
        .from("era_line_detail")
        .select("*")
        .eq("remittance_advice_id", remittanceId);

      if (error) throw error;
      set({ eraLineDetails: data || [] });
    } catch (error) {
      console.error("Failed to fetch ERA line details:", error);
    }
  },

  postPayment: async (paymentData) => {
    try {
      const { data, error } = await supabase
        .from("payment_detail")
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        get().addPaymentDetail(data);
      }
    } catch (error) {
      console.error("Failed to post payment:", error);
      throw error;
    }
  },

  reconcilePayment: async (paymentId, reconciliationData) => {
    try {
      const { data, error } = await supabase
        .from("payment_reconciliation")
        .insert([
          {
            payment_detail_id: paymentId,
            ...reconciliationData,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        get().addPaymentReconciliation(data);
      }

      // Update payment detail status
      get().updatePaymentDetail(paymentId, { status: "reconciled" });
    } catch (error) {
      console.error("Failed to reconcile payment:", error);
      throw error;
    }
  },
});

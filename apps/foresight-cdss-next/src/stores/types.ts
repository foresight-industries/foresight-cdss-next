// stores/types.ts
import type { Tables } from "@/types/database.types";

export type ClaimFilters = {
  status?: Tables<"claim">["status"][];
  payerId?: number;
  dateRange?:
    | "today"
    | "last_7_days"
    | "last_30_days"
    | "last_90_days"
    | "custom";
  customDateRange?: { from: Date; to: Date };
  minAmount?: number;
  maxAmount?: number;
  hasdenial?: boolean;
  assignedTo?: string;
};

export type PAFilters = {
  status?: Tables<"prior_auth">["status"][];
  payerId?: number;
  medication?: string;
  urgency?: "routine" | "urgent" | "stat";
  expiringWithin?: number; // days
};

export type WorkQueueFilters = {
  queueType?: string;
  priority?: number[];
  status?: Tables<"work_queue">["status"][];
  assignedTo?: string;
  overdue?: boolean;
};

export type Notification = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export type WorkflowStep = {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  data?: Record<string, any>;
};

import type { PreEncounterIssue } from '@/types/pre-encounter.types';
import {
  mockPreEncounterIssues,
  mockPreEncounterAnalytics,
} from '@/data/pre-encounter';

export interface PreEncountersData {
  issues: PreEncounterIssue[];
  analytics: typeof mockPreEncounterAnalytics;
  payers: Array<{ name: string }>;
}

export async function getPreEncountersData(): Promise<PreEncountersData> {
  // In production, this would be actual database queries
  const issues = mockPreEncounterIssues;
  const analytics = mockPreEncounterAnalytics;
  
  // Extract unique payers from issues for filter options
  const payerSet = new Set(
    issues.map(issue => issue.payerName).filter((name): name is string => Boolean(name))
  );
  const payers = Array.from(payerSet).sort().map(name => ({ name }));

  return {
    issues,
    analytics,
    payers,
  };
}
import type { AuditEntry } from '@/components/dashboard/audit-trail';

// Helper function to generate timestamps for recent activity
const getRecentTimestamp = (minutesAgo: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const demoAuditEntries: AuditEntry[] = [
  {
    id: 'audit-001',
    message: 'Claim status updated to Paid · Claims (CLM-8901)',
    actor: 'Dr. Sarah Chen',
    timestamp: getRecentTimestamp(5),
  },
  {
    id: 'audit-002', 
    message: 'Prior authorization approved · ePA Requests (EPA-2024-0157)',
    actor: 'AutoApproval System',
    timestamp: getRecentTimestamp(12),
  },
  {
    id: 'audit-003',
    message: 'New claim submitted · Claims (CLM-8902)',
    actor: 'John Martinez',
    timestamp: getRecentTimestamp(23),
  },
  {
    id: 'audit-004',
    message: 'Denial reason updated · Claims (CLM-8845)',
    actor: 'Dr. Sarah Chen',
    timestamp: getRecentTimestamp(35),
  },
  {
    id: 'audit-005',
    message: 'Prior authorization request created · ePA Requests (EPA-2024-0158)',
    actor: 'Emily Rodriguez',
    timestamp: getRecentTimestamp(47),
  },
  {
    id: 'audit-006',
    message: 'Payment received · Claims (CLM-8876)',
    actor: 'Payer Portal Sync',
    timestamp: getRecentTimestamp(58),
  },
  {
    id: 'audit-007',
    message: 'Claim resubmitted after review · Claims (CLM-8834)',
    actor: 'Michael Thompson',
    timestamp: getRecentTimestamp(72),
  },
  {
    id: 'audit-008',
    message: 'Prior authorization denied · ePA Requests (EPA-2024-0155)',
    actor: 'Automated Processing',
    timestamp: getRecentTimestamp(89),
  },
  {
    id: 'audit-009',
    message: 'New patient record created · Patients (PAT-2024-1234)',
    actor: 'Jennifer Wilson',
    timestamp: getRecentTimestamp(105),
  },
  {
    id: 'audit-010',
    message: 'Billing rule updated · Configuration',
    actor: 'System Administrator',
    timestamp: getRecentTimestamp(127),
  },
];
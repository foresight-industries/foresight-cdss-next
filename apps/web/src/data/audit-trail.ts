// Enhanced audit entry interface for the audit trail page
export interface DetailedAuditEntry {
  id: string;
  message: string;
  actor: string | null;
  timestamp: string;
  rawTimestamp: Date; // For sorting and filtering
  operation: string;
  tableName: string;
  recordId: string | null;
  entityType: 'claims' | 'epa' | 'patients' | 'payments' | 'configuration' | 'users';
  severity: 'info' | 'warning' | 'error' | 'success';
  ipAddress?: string;
  userAgent?: string;
  duration?: number; // in milliseconds
}

// Legacy interface for dashboard compatibility
export interface AuditEntry {
  id?: string;
  message: string;
  actor?: string | null;
  timestamp: string;
}

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

// Helper function to get raw timestamp
const getRawTimestamp = (minutesAgo: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date;
};

// Legacy demo entries for dashboard compatibility
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

// Comprehensive demo dataset for audit trail page
export const detailedAuditEntries: DetailedAuditEntry[] = [
  // Recent activity (last few hours)
  {
    id: 'audit-det-001',
    message: 'Claim status updated to Paid',
    actor: 'Dr. Sarah Chen',
    timestamp: getRecentTimestamp(5),
    rawTimestamp: getRawTimestamp(5),
    operation: 'update',
    tableName: 'claims',
    recordId: 'CLM-8901',
    entityType: 'claims',
    severity: 'success',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    duration: 234,
  },
  {
    id: 'audit-det-002',
    message: 'Prior authorization approved automatically',
    actor: 'AutoApproval System',
    timestamp: getRecentTimestamp(12),
    rawTimestamp: getRawTimestamp(12),
    operation: 'approve',
    tableName: 'epa_requests',
    recordId: 'EPA-2024-0157',
    entityType: 'epa',
    severity: 'success',
    duration: 1850,
  },
  {
    id: 'audit-det-003',
    message: 'New claim submitted for review',
    actor: 'John Martinez',
    timestamp: getRecentTimestamp(23),
    rawTimestamp: getRawTimestamp(23),
    operation: 'create',
    tableName: 'claims',
    recordId: 'CLM-8902',
    entityType: 'claims',
    severity: 'info',
    ipAddress: '10.0.0.142',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    duration: 1456,
  },
  {
    id: 'audit-det-004',
    message: 'Denial reason updated with automation guidance',
    actor: 'Dr. Sarah Chen',
    timestamp: getRecentTimestamp(35),
    rawTimestamp: getRawTimestamp(35),
    operation: 'update',
    tableName: 'claims',
    recordId: 'CLM-8845',
    entityType: 'claims',
    severity: 'warning',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    duration: 2103,
  },
  {
    id: 'audit-det-005',
    message: 'Prior authorization request created',
    actor: 'Emily Rodriguez',
    timestamp: getRecentTimestamp(47),
    rawTimestamp: getRawTimestamp(47),
    operation: 'create',
    tableName: 'epa_requests',
    recordId: 'EPA-2024-0158',
    entityType: 'epa',
    severity: 'info',
    ipAddress: '10.0.0.98',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    duration: 3421,
  },
  
  // Yesterday's activity
  {
    id: 'audit-det-006',
    message: 'Payment received from payer portal',
    actor: 'Payer Portal Sync',
    timestamp: getRecentTimestamp(1458), // ~24 hours ago
    rawTimestamp: getRawTimestamp(1458),
    operation: 'create',
    tableName: 'payments',
    recordId: 'PAY-2024-8876',
    entityType: 'payments',
    severity: 'success',
    duration: 567,
  },
  {
    id: 'audit-det-007',
    message: 'Claim resubmitted after review',
    actor: 'Michael Thompson',
    timestamp: getRecentTimestamp(1472),
    rawTimestamp: getRawTimestamp(1472),
    operation: 'resubmit',
    tableName: 'claims',
    recordId: 'CLM-8834',
    entityType: 'claims',
    severity: 'info',
    ipAddress: '10.0.0.76',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    duration: 1829,
  },
  {
    id: 'audit-det-008',
    message: 'Prior authorization denied by payer',
    actor: 'Automated Processing',
    timestamp: getRecentTimestamp(1489),
    rawTimestamp: getRawTimestamp(1489),
    operation: 'deny',
    tableName: 'epa_requests',
    recordId: 'EPA-2024-0155',
    entityType: 'epa',
    severity: 'error',
    duration: 892,
  },
  {
    id: 'audit-det-009',
    message: 'New patient record created',
    actor: 'Jennifer Wilson',
    timestamp: getRecentTimestamp(1505),
    rawTimestamp: getRawTimestamp(1505),
    operation: 'create',
    tableName: 'patients',
    recordId: 'PAT-2024-1234',
    entityType: 'patients',
    severity: 'info',
    ipAddress: '192.168.1.201',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    duration: 2341,
  },
  {
    id: 'audit-det-010',
    message: 'Billing rule configuration updated',
    actor: 'System Administrator',
    timestamp: getRecentTimestamp(1527),
    rawTimestamp: getRawTimestamp(1527),
    operation: 'update',
    tableName: 'configuration',
    recordId: 'CFG-BILLING-001',
    entityType: 'configuration',
    severity: 'warning',
    ipAddress: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (Ubuntu; Linux x86_64)',
    duration: 4567,
  },
];

// Generate additional audit entries to simulate a larger dataset
const generateMoreAuditEntries = (): DetailedAuditEntry[] => {
  const actors = ['Dr. Sarah Chen', 'John Martinez', 'Emily Rodriguez', 'Michael Thompson', 'Jennifer Wilson', 'Dr. Amanda Lopez', 'Robert Kim', 'Lisa Zhang', 'Automated Processing', 'Payer Portal Sync', 'AutoApproval System'];
  const operations = ['create', 'update', 'delete', 'approve', 'deny', 'resubmit', 'review', 'sync'];
  const tables = ['claims', 'epa_requests', 'patients', 'payments', 'configuration', 'users'];
  const entityTypes: DetailedAuditEntry['entityType'][] = ['claims', 'epa', 'patients', 'payments', 'configuration', 'users'];
  const severities: DetailedAuditEntry['severity'][] = ['info', 'warning', 'error', 'success'];
  
  const entries: DetailedAuditEntry[] = [];
  
  // Generate entries for the past 7 days
  for (let i = 0; i < 500; i++) {
    const minutesAgo = Math.floor(Math.random() * 10080) + 1530; // 7 days + base offset
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const table = tables[Math.floor(Math.random() * tables.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const actor = actors[Math.floor(Math.random() * actors.length)];
    
    const recordPrefix = table === 'claims' ? 'CLM' : 
                        table === 'epa_requests' ? 'EPA' :
                        table === 'patients' ? 'PAT' :
                        table === 'payments' ? 'PAY' :
                        table === 'configuration' ? 'CFG' : 'USR';
    
    const recordId = `${recordPrefix}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
    
    const messages = {
      create: `New ${table.slice(0, -1)} created`,
      update: `${table.slice(0, -1)} updated`,
      delete: `${table.slice(0, -1)} deleted`,
      approve: `${table.slice(0, -1)} approved`,
      deny: `${table.slice(0, -1)} denied`,
      resubmit: `${table.slice(0, -1)} resubmitted`,
      review: `${table.slice(0, -1)} reviewed`,
      sync: `${table.slice(0, -1)} synchronized`,
    };
    
    entries.push({
      id: `audit-gen-${i + 1}`,
      message: messages[operation as keyof typeof messages] || `${operation} performed on ${table}`,
      actor,
      timestamp: getRecentTimestamp(minutesAgo),
      rawTimestamp: getRawTimestamp(minutesAgo),
      operation,
      tableName: table,
      recordId,
      entityType,
      severity,
      ipAddress: actor.includes('Automated') || actor.includes('System') ? undefined : `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: actor.includes('Automated') || actor.includes('System') ? undefined : 'Mozilla/5.0 (compatible)',
      duration: Math.floor(Math.random() * 5000) + 100,
    });
  }
  
  return entries;
};

// Export all audit entries (detailed + generated)
export const allDetailedAuditEntries: DetailedAuditEntry[] = [
  ...detailedAuditEntries,
  ...generateMoreAuditEntries(),
].sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime());
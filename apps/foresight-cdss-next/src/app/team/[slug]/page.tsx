import { Tables } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/dashboard-client';
import { epaQueueItems } from '@/data/epa-queue';
import { initialClaims } from '@/data/claims';
import { demoAuditEntries } from '@/data/audit-trail';
import { combineStatusDistribution } from '@/utils/dashboard';

const formatAuditMessage = (operation: string, tableName: string, recordId: string | null) => {
  const friendlyOperation = operation.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const base = `${friendlyOperation} · ${tableName}`;
  return recordId ? `${base} (${recordId})` : base;
};

const formatAuditTimestamp = (value: string | null) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

async function loadDashboardData() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auditLogData, error: auditError } = await supabase
      .from(Tables.AUDIT_LOG)
      .select('id, table_name, operation, record_id, created_at, auth_uid')
      .order('created_at', { ascending: false })
      .limit(10);

    if (auditError) {
      console.error('Error fetching audit log:', auditError);
    }

    const auditEntries = auditLogData && auditLogData.length > 0 
      ? auditLogData.map((entry) => ({
          id: entry.id,
          message: formatAuditMessage(entry.operation, entry.table_name, entry.record_id),
          actor: entry.auth_uid,
          timestamp: formatAuditTimestamp(entry.created_at),
        }))
      : demoAuditEntries;

    return {
      epaItems: epaQueueItems,
      claimItems: initialClaims,
      statusDistribution: combineStatusDistribution(epaQueueItems, initialClaims),
      auditEntries,
    };
  } catch (error) {
    console.error('Team dashboard data fetch error:', error);
    return {
      epaItems: epaQueueItems,
      claimItems: initialClaims,
      statusDistribution: combineStatusDistribution(epaQueueItems, initialClaims),
      auditEntries: demoAuditEntries,
    };
  }
}

export default async function DashboardPage() {
  const dashboardData = await loadDashboardData();

  return (
    <DashboardClient
      epaItems={dashboardData.epaItems}
      claimItems={dashboardData.claimItems}
      statusDistribution={dashboardData.statusDistribution}
      auditEntries={dashboardData.auditEntries}
    />
  );
}

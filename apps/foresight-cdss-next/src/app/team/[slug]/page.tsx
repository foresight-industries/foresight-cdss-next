import { createDatabaseClient, safeSelect } from '@/lib/aws/database';
import { eq } from 'drizzle-orm';
import { auditLogs, teamMembers, userProfiles } from '@foresight-cdss-next/db';
import DashboardClient from '@/components/dashboard/dashboard-client';
import { epaQueueItems } from '@/data/epa-queue';
import { initialClaims } from '@/data/claims';
import { demoAuditEntries } from '@/data/audit-trail';
import { combineStatusDistribution } from '@/utils/dashboard';
import { headers } from 'next/headers';

const formatAuditMessage = (action: string, entityType: string, entityId: string | null) => {
  const friendlyAction = action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const base = `${friendlyAction} · ${entityType}`;
  return entityId ? `${base} (${entityId})` : base;
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

async function loadDashboardData(organizationId: string) {
  try {
    const { db } = await createDatabaseClient();
    
    // Get audit logs for the organization with user details
    const { data: auditLogData } = await safeSelect(async () =>
      db.select({
        id: auditLogs.id,
        entityType: auditLogs.entityType,
        action: auditLogs.action,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        // Get user details if available
        userEmail: userProfiles.email
      })
      .from(auditLogs)
      .leftJoin(teamMembers, eq(auditLogs.userId, teamMembers.id))
      .leftJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(eq(auditLogs.organizationId, organizationId))
      .orderBy(auditLogs.createdAt)
      .limit(10)
    );

    const auditEntries = auditLogData && auditLogData.length > 0
      ? auditLogData.map((entry: any) => ({
          id: entry.id,
          message: formatAuditMessage(entry.action, entry.entityType, entry.entityId),
          actor: entry.userEmail || 'System', // Use email or fallback to System
          timestamp: formatAuditTimestamp(entry.createdAt),
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
  // Get organization ID from middleware headers
  const headersList = await headers();
  const organizationId = headersList.get('x-team-id'); // Still using x-team-id header for backward compatibility

  if (!organizationId) {
    console.error('Organization ID not found in headers');
    // Fallback to demo data if no organization ID
    const dashboardData = {
      epaItems: epaQueueItems,
      claimItems: initialClaims,
      statusDistribution: combineStatusDistribution(epaQueueItems, initialClaims),
      auditEntries: demoAuditEntries,
    };

    return (
      <DashboardClient
        epaItems={dashboardData.epaItems}
        claimItems={dashboardData.claimItems}
        statusDistribution={dashboardData.statusDistribution}
        auditEntries={dashboardData.auditEntries}
      />
    );
  }

  const dashboardData = await loadDashboardData(organizationId);

  return (
    <DashboardClient
      epaItems={dashboardData.epaItems}
      claimItems={dashboardData.claimItems}
      statusDistribution={dashboardData.statusDistribution}
      auditEntries={dashboardData.auditEntries}
    />
  );
}

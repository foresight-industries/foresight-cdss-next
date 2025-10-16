import { NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { asc } from 'drizzle-orm';
import { ehrSystems } from '@foresight-cdss-next/db';

// GET - List available EHR systems
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get all available EHR systems
    const { data: ehrSystemsData, error } = await safeSelect(async () =>
      db.select({
        id: ehrSystems.id,
        organizationId: ehrSystems.organizationId,
        systemName: ehrSystems.systemName,
        vendor: ehrSystems.vendor,
        version: ehrSystems.version,
        apiType: ehrSystems.apiType,
        baseUrl: ehrSystems.baseUrl,
        authMethod: ehrSystems.authMethod,
        clientId: ehrSystems.clientId,
        redirectUri: ehrSystems.redirectUri,
        scopes: ehrSystems.scopes,
        supportedResources: ehrSystems.supportedResources,
        supportedOperations: ehrSystems.supportedOperations,
        syncEnabled: ehrSystems.syncEnabled,
        syncFrequency: ehrSystems.syncFrequency,
        lastSyncAt: ehrSystems.lastSyncAt,
        isActive: ehrSystems.isActive,
        createdAt: ehrSystems.createdAt,
        updatedAt: ehrSystems.updatedAt
      })
      .from(ehrSystems)
      .where(ehrSystems.isActive)
      .orderBy(asc(ehrSystems.systemName))
    );

    if (error) {
      console.error('Error fetching EHR systems:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      ehr_systems: ehrSystemsData || []
    });

  } catch (error) {
    console.error('EHR systems GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

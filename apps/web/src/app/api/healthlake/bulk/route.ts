import { NextRequest, NextResponse } from 'next/server';
import { healthLakeService } from '@/lib/services/healthlake-integration';
import { healthLakeSyncService } from '@/lib/services/healthlake-sync';
import { db } from '@foresight-cdss-next/db';
import { organizations, fhirResources } from '@foresight-cdss-next/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      organizationIds,
      datastoreId,
      s3BucketUri,
      dataAccessRoleArn,
      jobName,
      resourceTypes,
      filters
    } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (import, export, sync)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'import':
        return await handleBulkImport(request, {
          datastoreId,
          s3BucketUri,
          dataAccessRoleArn,
          jobName
        });

      case 'export':
        return await handleBulkExport(request, {
          datastoreId,
          s3BucketUri,
          dataAccessRoleArn,
          jobName,
          organizationIds,
          resourceTypes,
          filters
        });

      case 'sync':
        return await handleBulkSync(request, {
          organizationIds,
          datastoreId,
          s3BucketUri,
          dataAccessRoleArn
        });

      case 'status':
        return await handleJobStatus(request);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be import, export, sync, or status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('HealthLake bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const datastoreId = searchParams.get('datastoreId');
    const jobId = searchParams.get('jobId');

    if (action === 'status' && datastoreId && jobId) {
      return await getJobStatus(datastoreId, jobId);
    }

    if (action === 'list-datastores') {
      return await listDatastores();
    }

    if (action === 'datastore-info' && datastoreId) {
      return await getDatastoreInfo(datastoreId);
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('HealthLake bulk GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleBulkImport(
  request: NextRequest,
  params: {
    datastoreId: string;
    s3BucketUri: string;
    dataAccessRoleArn: string;
    jobName?: string;
  }
) {
  const { datastoreId, s3BucketUri, dataAccessRoleArn, jobName } = params;

  if (!datastoreId || !s3BucketUri || !dataAccessRoleArn) {
    return NextResponse.json(
      { error: 'Missing required parameters: datastoreId, s3BucketUri, dataAccessRoleArn' },
      { status: 400 }
    );
  }

  try {
    const jobId = await healthLakeService.startImportJob(
      datastoreId,
      s3BucketUri,
      dataAccessRoleArn,
      jobName || `bulk-import-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Bulk import job started successfully',
      status: 'SUBMITTED'
    });

  } catch (error) {
    console.error('Failed to start bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to start bulk import job' },
      { status: 500 }
    );
  }
}

async function handleBulkExport(
  request: NextRequest,
  params: {
    datastoreId: string;
    s3BucketUri: string;
    dataAccessRoleArn: string;
    jobName?: string;
    organizationIds?: string[];
    resourceTypes?: string[];
    filters?: Record<string, any>;
  }
) {
  const {
    datastoreId,
    s3BucketUri,
    dataAccessRoleArn,
    jobName,
    organizationIds,
    resourceTypes,
    filters
  } = params;

  if (!datastoreId || !s3BucketUri || !dataAccessRoleArn) {
    return NextResponse.json(
      { error: 'Missing required parameters: datastoreId, s3BucketUri, dataAccessRoleArn' },
      { status: 400 }
    );
  }

  try {
    // Validate organizations if specified
    if (organizationIds && organizationIds.length > 0) {
      const validOrgs = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(inArray(organizations.id, organizationIds));

      if (validOrgs.length !== organizationIds.length) {
        return NextResponse.json(
          { error: 'One or more organization IDs are invalid' },
          { status: 400 }
        );
      }
    }

    const exportJobName = jobName || `bulk-export-${organizationIds?.join('-') || 'all'}-${Date.now()}`;
    const exportS3Uri = `${s3BucketUri}/exports/${exportJobName}/`;

    const jobId = await healthLakeService.startExportJob(
      datastoreId,
      exportS3Uri,
      dataAccessRoleArn,
      exportJobName
    );

    // Store export job metadata for tracking
    const exportMetadata = {
      jobId,
      organizationIds: organizationIds || [],
      resourceTypes: resourceTypes || [],
      filters: filters || {},
      startTime: new Date(),
      s3OutputPath: exportS3Uri
    };

    return NextResponse.json({
      success: true,
      jobId,
      exportMetadata,
      message: 'Bulk export job started successfully',
      status: 'SUBMITTED',
      estimatedCompletionTime: '15-30 minutes'
    });

  } catch (error) {
    console.error('Failed to start bulk export:', error);
    return NextResponse.json(
      { error: 'Failed to start bulk export job' },
      { status: 500 }
    );
  }
}

async function handleBulkSync(
  request: NextRequest,
  params: {
    organizationIds?: string[];
    datastoreId: string;
    s3BucketUri: string;
    dataAccessRoleArn: string;
  }
) {
  const { organizationIds, datastoreId, s3BucketUri, dataAccessRoleArn } = params;

  if (!datastoreId || !s3BucketUri || !dataAccessRoleArn) {
    return NextResponse.json(
      { error: 'Missing required parameters: datastoreId, s3BucketUri, dataAccessRoleArn' },
      { status: 400 }
    );
  }

  try {
    // Get organizations to sync
    let orgsToSync = organizationIds;
    if (!orgsToSync) {
      const allOrgs = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.status, 'active'));
      orgsToSync = allOrgs.map(org => org.id);
    }

    if (orgsToSync?.length === 0) {
      return NextResponse.json(
        { error: 'No organizations found to sync' },
        { status: 400 }
      );
    }

    // Start bidirectional sync
    const syncStatus = await healthLakeSyncService.performBidirectionalSync(orgsToSync);

    return NextResponse.json({
      success: true,
      syncId: syncStatus.syncId,
      organizationCount: orgsToSync?.length,
      organizationIds: orgsToSync,
      message: 'Bidirectional sync started successfully',
      syncStatus: {
        status: syncStatus.status,
        direction: syncStatus.direction,
        startTime: syncStatus.startTime,
        healthLakeJobIds: syncStatus.healthLakeJobIds
      },
      estimatedCompletionTime: '30-60 minutes'
    });

  } catch (error) {
    console.error('Failed to start bulk sync:', error);
    return NextResponse.json(
      { error: 'Failed to start bulk sync' },
      { status: 500 }
    );
  }
}

async function handleJobStatus(request: NextRequest) {
  const { datastoreId, jobId, syncId } = await request.json();

  try {
    if (syncId) {
      // Get sync status
      const syncStatus = healthLakeSyncService.getSyncStatus(syncId);
      if (!syncStatus) {
        return NextResponse.json(
          { error: 'Sync job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        syncStatus
      });
    }

    if (!datastoreId || !jobId) {
      return NextResponse.json(
        { error: 'Missing datastoreId and jobId for job status check' },
        { status: 400 }
      );
    }

    // Check both import and export job status
    const [importJob, exportJob] = await Promise.allSettled([
      healthLakeService.getImportJobStatus(datastoreId, jobId),
      healthLakeService.getExportJobStatus(datastoreId, jobId)
    ]);

    let jobStatus = null;
    let jobType = null;

    if (importJob.status === 'fulfilled' && importJob.value) {
      jobStatus = importJob.value;
      jobType = 'import';
    } else if (exportJob.status === 'fulfilled' && exportJob.value) {
      jobStatus = exportJob.value;
      jobType = 'export';
    }

    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobType,
      jobStatus
    });

  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

async function getJobStatus(datastoreId: string, jobId: string) {
  try {
    // Try both import and export job status
    const [importJob, exportJob] = await Promise.allSettled([
      healthLakeService.getImportJobStatus(datastoreId, jobId),
      healthLakeService.getExportJobStatus(datastoreId, jobId)
    ]);

    let jobStatus = null;
    let jobType = null;

    if (importJob.status === 'fulfilled' && importJob.value) {
      jobStatus = importJob.value;
      jobType = 'import';
    } else if (exportJob.status === 'fulfilled' && exportJob.value) {
      jobStatus = exportJob.value;
      jobType = 'export';
    }

    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobType,
      jobStatus
    });

  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

async function listDatastores() {
  try {
    const datastores = await healthLakeService.listDatastores();

    return NextResponse.json({
      success: true,
      datastores
    });

  } catch (error) {
    console.error('Failed to list datastores:', error);
    return NextResponse.json(
      { error: 'Failed to list datastores' },
      { status: 500 }
    );
  }
}

async function getDatastoreInfo(datastoreId: string) {
  try {
    const datastore = await healthLakeService.getDatastore(datastoreId);

    if (!datastore) {
      return NextResponse.json(
        { error: 'Datastore not found' },
        { status: 404 }
      );
    }

    // Get additional metrics
    const resourceCounts = await db
      .select({
        organizationId: fhirResources.organizationId,
        resourceType: fhirResources.resourceType,
        count: db.$count(fhirResources)
      })
      .from(fhirResources)
      .groupBy(fhirResources.organizationId, fhirResources.resourceType);

    return NextResponse.json({
      success: true,
      datastore,
      metrics: {
        totalLocalResources: resourceCounts.reduce((sum: number, item) => sum + item.count, 0),
        resourcesByType: resourceCounts.reduce((acc: Record<string, number>, item) => {
          acc[item.resourceType] = (acc[item.resourceType] ?? 0) + item.count;
          return acc;
        }, {} as Record<string, number>),
        organizationCount: new Set(resourceCounts.map(item => item.organizationId)).size
      }
    });

  } catch (error) {
    console.error('Failed to get datastore info:', error);
    return NextResponse.json(
      { error: 'Failed to get datastore info' },
      { status: 500 }
    );
  }
}

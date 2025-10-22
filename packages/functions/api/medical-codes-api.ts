import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { sql } from 'drizzle-orm';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

if (!process.env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME is not defined');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

const db = drizzle(rdsClient, {
  database: process.env.DATABASE_NAME,
  secretArn: process.env.DATABASE_SECRET_ARN,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
});

interface CodeSearchRequest {
  query: string;
  type?: 'icd10' | 'cpt' | 'both';
  limit?: number;
  offset?: number;
}

interface UpdateRequest {
  sourceFile: string;
  codeType: 'icd10' | 'cpt';
  version: string;
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // GET /medical-codes/search - Search medical codes
    if (method === 'GET' && path.includes('/search')) {
      const params = event.queryStringParameters || {};
      const searchRequest: CodeSearchRequest = {
        query: params.query || '',
        type: (params.type as 'icd10' | 'cpt' | 'both') || 'both',
        limit: parseInt(params.limit || '50'),
        offset: parseInt(params.offset || '0'),
      };

      const results = await searchMedicalCodes(searchRequest);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(results),
      };
    }

    // POST /medical-codes/update - Trigger annual code update
    if (method === 'POST' && path.includes('/update')) {
      const updateRequest: UpdateRequest = JSON.parse(event.body || '{}');
      const result = await triggerCodeUpdate(updateRequest);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // GET /medical-codes/status - Get update status
    if (method === 'GET' && path.includes('/status')) {
      const status = await getUpdateStatus();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(status),
      };
    }

    // GET /medical-codes/cache/stats - Get cache statistics
    if (method === 'GET' && path.includes('/cache/stats')) {
      const stats = await getCacheStats();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error: any) {
    console.error('Error in medical codes API:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

async function searchMedicalCodes(request: CodeSearchRequest) {
  try {
    const { query, type, limit, offset } = request;

    if (!query || query.length < 2) {
      return {
        results: [],
        total: 0,
        query,
        type,
      };
    }

    const results = [];

    // Search ICD-10 codes
    if (type === 'icd10' || type === 'both') {
      const icd10Results = await db.execute(sql`
        SELECT
          code,
          description,
          'icd10' as type,
          is_active,
          effective_date,
          version
        FROM icd10_code_master
        WHERE
          (code ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`})
          AND is_active = true
        ORDER BY
          CASE WHEN code = ${query} THEN 1 ELSE 2 END,
          LENGTH(code),
          code
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      results.push(...icd10Results.rows);
    }

    // Search CPT codes
    if (type === 'cpt' || type === 'both') {
      const cptResults = await db.execute(sql`
        SELECT
          code,
          description,
          'cpt' as type,
          is_active,
          effective_date,
          version
        FROM cpt_code_master
        WHERE
          (code ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`})
          AND is_active = true
        ORDER BY
          CASE WHEN code = ${query} THEN 1 ELSE 2 END,
          LENGTH(code),
          code
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      results.push(...cptResults.rows);
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
      query,
      type,
      limit,
      offset,
    };

  } catch (error) {
    console.error('Error searching medical codes:', error);
    throw new Error('Failed to search medical codes');
  }
}

async function triggerCodeUpdate(request: UpdateRequest) {
  try {
    const { sourceFile, codeType, version } = request;

    // Create update record
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    await db.execute(sql`
      INSERT INTO annual_code_updates (
        id,
        code_type,
        version,
        source_file,
        status,
        started_at,
        created_at
      ) VALUES (
        ${updateId},
        ${codeType},
        ${version},
        ${sourceFile},
        'initiated',
        NOW(),
        NOW()
      )
    `);

    // In a real implementation, this would trigger an async process
    // For now, we'll return the update ID for tracking

    return {
      success: true,
      updateId,
      message: 'Code update initiated successfully',
      status: 'initiated',
      estimatedDuration: '15-30 minutes',
    };

  } catch (error) {
    console.error('Error triggering code update:', error);
    throw new Error('Failed to trigger code update');
  }
}

async function getUpdateStatus() {
  try {
    const recentUpdates = await db.execute(sql`
      SELECT
        id,
        code_type,
        version,
        status,
        started_at,
        completed_at,
        error_message,
        records_processed,
        records_added,
        records_updated
      FROM annual_code_updates
      ORDER BY started_at DESC
      LIMIT 10
    `);

    return {
      recentUpdates: recentUpdates.rows,
      lastUpdate: recentUpdates.rows[0] || null,
    };

  } catch (error) {
    console.error('Error getting update status:', error);
    throw new Error('Failed to get update status');
  }
}

async function getCacheStats() {
  try {
    // Get statistics about code usage and cache performance
    const stats = await db.execute(sql`
      SELECT
        'icd10' as code_type,
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE is_active = true) as active_codes,
        MAX(updated_at) as last_updated
      FROM icd10_code_master
      UNION ALL
      SELECT
        'cpt' as code_type,
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE is_active = true) as active_codes,
        MAX(updated_at) as last_updated
      FROM cpt_code_master
    `);

    return {
      codeStats: stats.rows,
      cacheInfo: {
        enabled: true,
        defaultTtl: process.env.CACHE_DEFAULT_TTL || '3600',
        hotCodesTtl: process.env.CACHE_HOT_CODES_TTL || '7200',
      },
      bucketInfo: {
        medicalCodesBucket: process.env.MEDICAL_CODES_BUCKET,
        backupBucket: process.env.MEDICAL_CODES_BACKUP_BUCKET,
      },
    };

  } catch (error) {
    console.error('Error getting cache stats:', error);
    throw new Error('Failed to get cache statistics');
  }
}

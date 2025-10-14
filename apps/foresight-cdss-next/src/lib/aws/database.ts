import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { teamMembers, db } from '@foresight-cdss-next/db';

/**
 * AWS RDS Database Client
 * Replaces Supabase with AWS Aurora PostgreSQL + Data API
 */

// Environment validation
if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN environment variable is required');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN environment variable is required');
}

if (!process.env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME environment variable is required');
}

/**
 * Get current user's organization ID from database
 */
async function getUserTeamId(userId: string): Promise<string | null> {
  try {
    // Try to get from team_member table first
    const teamMember = await db
      .select({ organizationId: teamMembers.organizationId })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1);

    if (teamMember.length > 0) {
      return teamMember[0].organizationId;
    }

    return null;
  } catch (error) {
    console.debug('Could not fetch user team:', error);
    return null;
  }
}

/**
 * Create authenticated database client with team context
 * This replaces createSupabaseServerClient()
 */
export async function createDatabaseClient() {
  try {
    const { userId } = await auth();

    if (!userId) {
      // Return unauthenticated client for SSR operations
      return {
        db: db as any, // Cast to avoid TS4094 error
        userId: null,
        teamId: null,
        isAuthenticated: false as const
      };
    }

    // Get user's team context
    const teamId = await getUserTeamId(userId);

    return {
      db: db as any, // Cast to avoid TS4094 error
      userId,
      teamId,
      isAuthenticated: true as const
    };
  } catch (error) {
    console.error('Error creating database client:', error);
    // Fallback to unauthenticated client
    return {
      db: db as any, // Cast to avoid TS4094 error
      userId: null,
      teamId: null,
      isAuthenticated: false as const
    };
  }
}

/**
 * Create database client that requires authentication
 * This replaces createAuthenticatedSupabaseClient()
 */
export async function createAuthenticatedDatabaseClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  const teamId = await getUserTeamId(userId);

  return {
    db: db as any, // Cast to avoid TS4094 error
    userId,
    teamId,
    isAuthenticated: true as const
  };
}

/**
 * Admin database client (no auth, full access)
 * This replaces createSupabaseAdminClient()
 */
export function createDatabaseAdminClient() {
  return {
    db: db as any, // Cast to avoid TS4094 error
    userId: null,
    teamId: null,
    isAdmin: true as const
  };
}

/**
 * Get current user info
 * This replaces getCurrentUser()
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const teamId = await getUserTeamId(userId);

    return {
      userId,
      teamId,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Execute RLS-aware queries
 * This helper ensures proper team filtering for multi-tenant operations
 */
export function withTeamContext<T>(
  query: any,
  teamId: string | null,
  teamColumn = 'team_id'
) {
  if (!teamId) {
    throw new Error('Team context required for this operation');
  }

  // Add team filter to the query
  return query.where(eq(sql.identifier(teamColumn), teamId));
}

/**
 * Supabase-compatible query wrapper
 * Converts Drizzle exceptions to Supabase-style {data, error} responses
 */
export async function executeQuery<T>(
  queryFn: () => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown database error')
    };
  }
}

/**
 * Supabase-compatible select wrapper
 */
export async function safeSelect<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    console.error('Database select error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown select error')
    };
  }
}

/**
 * Supabase-compatible single record wrapper
 */
export async function safeSingle<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const results = await queryFn();
    
    if (results.length === 0) {
      return { 
        data: null, 
        error: new Error('No rows found') 
      };
    }
    
    if (results.length > 1) {
      return {
        data: null,
        error: new Error('Multiple rows returned when single row expected')
      };
    }
    
    return { data: results[0], error: null };
  } catch (error) {
    console.error('Database single record error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown single record error')
    };
  }
}

/**
 * Supabase-compatible insert wrapper
 */
export async function safeInsert<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    console.error('Database insert error:', error);
    
    // Handle common database errors
    let errorMessage = 'Insert failed';
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Record already exists';
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Referenced record does not exist';
      } else if (error.message.includes('not null')) {
        errorMessage = 'Required field is missing';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      data: null,
      error: new Error(errorMessage)
    };
  }
}

/**
 * Supabase-compatible update wrapper
 */
export async function safeUpdate<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    console.error('Database update error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Update failed')
    };
  }
}

/**
 * Supabase-compatible delete wrapper
 */
export async function safeDelete<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    console.error('Database delete error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Delete failed')
    };
  }
}

// Export database instance for direct access when needed
export { db };

// Type exports
export type DatabaseClient = Awaited<ReturnType<typeof createDatabaseClient>>;
export type AuthenticatedDatabaseClient = Awaited<ReturnType<typeof createAuthenticatedDatabaseClient>>;
export type AdminDatabaseClient = ReturnType<typeof createDatabaseAdminClient>;

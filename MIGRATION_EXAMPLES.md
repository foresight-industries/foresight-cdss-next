# AWS Migration Examples

This file shows practical examples of how to migrate specific components from Supabase to AWS.

## Example 1: API Route Migration

### Before (Supabase)
```typescript
// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { name, slug } = body;

    // Check if slug is already taken
    const { data: existingTeam } = await supabase
      .from('team')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTeam) {
      return NextResponse.json({
        error: 'This team URL is already taken.'
      }, { status: 409 });
    }

    // Create team
    const { data: team, error } = await supabase
      .from('team')
      .insert({ name, slug })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### After (AWS) - Option 1: Using Supabase-compatible wrappers
```typescript
// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert } from '@/lib/aws/database';
import { organizations } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await createAuthenticatedDatabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    // Check if slug is already taken - Supabase-style error handling
    const { data: existingOrg, error: checkError } = await safeSingle(() =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
    );

    if (checkError && checkError.message !== 'No rows found') {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingOrg) {
      return NextResponse.json({
        error: 'This team URL is already taken.'
      }, { status: 409 });
    }

    // Create organization - Supabase-style error handling
    const { data: newOrg, error: insertError } = await safeInsert(() =>
      db.insert(organizations)
        .values({ name, slug })
        .returning()
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ team: newOrg?.[0] });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
```

### After (AWS) - Option 2: Direct Drizzle with try/catch
```typescript
// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { organizations } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await createAuthenticatedDatabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    // Check if slug is already taken
    const existingOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existingOrg.length > 0) {
      return NextResponse.json({
        error: 'This team URL is already taken.'
      }, { status: 409 });
    }

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({ name, slug })
      .returning();

    return NextResponse.json({ team: newOrg });
  } catch (error) {
    console.error('Team creation error:', error);
    
    // Handle common database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ error: 'Record already exists' }, { status: 409 });
      }
      if (error.message.includes('not null')) {
        return NextResponse.json({ error: 'Required field is missing' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
```

## Example 2: React Hook Migration

### Before (Supabase)
```typescript
// src/hooks/use-team.ts
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@clerk/nextjs';

export function useTeam() {
  const { userId } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchTeam = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('team_member')
        .select('team:team_id(*)')
        .eq('clerk_user_id', userId)
        .eq('status', 'active')
        .single();
      
      setTeam(data?.team);
      setLoading(false);
    };

    fetchTeam();
  }, [userId]);

  return { team, loading };
}
```

### After (AWS)
```typescript
// src/hooks/use-team.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useTeam() {
  const { userId } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchTeam = async () => {
      try {
        // Use API route that internally uses AWS database
        const response = await fetch('/api/user/team');
        if (response.ok) {
          const data = await response.json();
          setTeam(data.team);
        }
      } catch (error) {
        console.error('Failed to fetch team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [userId]);

  return { team, loading };
}
```

## Example 3: Storage Migration

### Before (Supabase)
```typescript
// Upload file component
import { createSupabaseClient } from '@/lib/supabase/client';

export async function uploadDocument(file: File, path: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}
```

### After (AWS)
```typescript
// Upload file component
import { documents } from '@/lib/aws/storage';

export async function uploadDocument(file: File, path: string) {
  const { data, error } = await documents.upload(path, file, {
    contentType: file.type
  });

  if (error) throw error;

  // Get signed URL for secure access
  const { data: urlData } = await documents.createSignedUrl(data.path, 3600);

  return { 
    url: urlData?.signedUrl || data.fullUrl, 
    path: data.path 
  };
}
```

## Example 4: Real-time Subscription Migration

### Before (Supabase)
```typescript
// Real-time component
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export function ClaimsRealtime() {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    
    const subscription = supabase
      .channel('claims-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setClaims(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setClaims(prev => 
              prev.map(claim => 
                claim.id === payload.new.id ? payload.new : claim
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <div>{/* Claims UI */}</div>;
}
```

### After (AWS)
```typescript
// Real-time component
import { useEffect, useState } from 'react';
import { createRealtimeClient } from '@/lib/aws/realtime';

export function ClaimsRealtime() {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const realtime = createRealtimeClient(process.env.NEXT_PUBLIC_REALTIME_ENDPOINT);
    
    const subscription = realtime
      .channel('claims')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setClaims(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setClaims(prev => 
              prev.map(claim => 
                claim.id === payload.new.id ? payload.new : claim
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      realtime.disconnect();
    };
  }, []);

  return <div>{/* Claims UI */}</div>;
}
```

## Example 5: Middleware Migration

### Before (Supabase)
```typescript
// src/middleware.ts
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function middleware(request: NextRequest) {
  const { userId } = await auth();
  
  if (userId) {
    const supabase = await createSupabaseMiddlewareClient();
    const { data: teamMember } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('clerk_user_id', userId)
      .single();
    
    if (teamMember?.team_id) {
      // User has team, allow access
      return NextResponse.next();
    }
  }
  
  return NextResponse.redirect(new URL('/onboard', request.url));
}
```

### After (AWS)
```typescript
// src/middleware.ts
import { getUserTeamSlug } from '@/lib/team-routing';
import { auth } from '@clerk/nextjs/server';

export async function middleware(request: NextRequest) {
  const { userId } = await auth();
  
  if (userId) {
    // Uses AWS database client internally
    const teamSlug = await getUserTeamSlug(userId);
    
    if (teamSlug) {
      // User has team, allow access
      return NextResponse.next();
    }
  }
  
  return NextResponse.redirect(new URL('/onboard', request.url));
}
```

## Example 6: Zustand Store Migration

### Before (Supabase)
```typescript
// src/stores/teamStore.ts
import { create } from 'zustand';
import { createSupabaseClient } from '@/lib/supabase/client';

interface TeamStore {
  team: Team | null;
  fetchTeam: (userId: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set) => ({
  team: null,
  
  fetchTeam: async (userId) => {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from('team_member')
      .select('team:team_id(*)')
      .eq('clerk_user_id', userId)
      .single();
    
    set({ team: data?.team });
  },
}));
```

### After (AWS)
```typescript
// src/stores/teamStore.ts
import { create } from 'zustand';

interface TeamStore {
  team: Team | null;
  fetchTeam: (userId: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set) => ({
  team: null,
  
  fetchTeam: async (userId) => {
    try {
      // Use API route that handles AWS database internally
      const response = await fetch('/api/user/team');
      if (response.ok) {
        const { team } = await response.json();
        set({ team });
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      set({ team: null });
    }
  },
}));
```

## Migration Patterns Summary

### 1. Direct Database Access (Server Components/API Routes)
- Replace `createSupabaseServerClient()` with `createAuthenticatedDatabaseClient()`
- Convert Supabase queries to Drizzle ORM syntax
- Use organization-based schema instead of teams

### 2. Client-Side Components (React Hooks/Components)
- Move database logic to API routes
- Use fetch calls to your API routes instead of direct database access
- Maintain the same component interface

### 3. Storage Operations
- Replace `supabase.storage` with AWS S3 storage client
- Use presigned URLs for secure access
- Maintain team-scoped file organization

### 4. Real-time Features
- Replace Supabase channels with AWS WebSocket/SSE
- Use API Gateway WebSocket endpoints
- Implement reconnection logic

### 5. Authentication Integration
- Keep Clerk authentication unchanged
- Update team context retrieval to use AWS database
- Maintain same authorization patterns

## Testing Each Migration

For each migrated component:

1. **Unit Test**: Test the new AWS integration
2. **Integration Test**: Test with real AWS resources
3. **Comparison Test**: Verify same results as Supabase version
4. **Performance Test**: Compare response times

## Error Handling Options

I've provided **two approaches** for handling database errors to match your existing Supabase patterns:

### Option 1: Supabase-Compatible Wrappers (Recommended for minimal migration effort)
Use the provided wrapper functions that convert Drizzle exceptions to `{data, error}` format:

```typescript
import { safeSingle, safeInsert, safeUpdate, safeDelete } from '@/lib/aws/database';

// Works exactly like Supabase
const { data: user, error } = await safeSingle(() =>
  db.select().from(users).where(eq(users.id, userId))
);

if (error) {
  console.error('Query failed:', error.message);
  return;
}

// Use data normally
console.log(user);
```

**Available wrappers:**
- `safeSelect<T>(queryFn)` - For multiple records
- `safeSingle<T>(queryFn)` - For single record (like Supabase `.single()`)
- `safeInsert<T>(queryFn)` - For insert operations
- `safeUpdate<T>(queryFn)` - For update operations  
- `safeDelete<T>(queryFn)` - For delete operations
- `executeQuery<T>(queryFn)` - Generic wrapper for any query

### Option 2: Native Drizzle with try/catch (Recommended for new code)
Use standard JavaScript exception handling:

```typescript
try {
  const users = await db.select().from(users).where(eq(users.id, userId));
  
  if (users.length === 0) {
    throw new Error('User not found');
  }
  
  console.log(users[0]);
} catch (error) {
  console.error('Query failed:', error);
  // Handle specific database errors
  if (error.message.includes('duplicate key')) {
    // Handle duplicate key violation
  }
}
```

### Error Type Mapping

The AWS client automatically maps common PostgreSQL errors to user-friendly messages:

| PostgreSQL Error | Mapped Message |
|------------------|----------------|
| `duplicate key` | "Record already exists" |
| `foreign key constraint` | "Referenced record does not exist" |
| `not null constraint` | "Required field is missing" |
| `check constraint` | "Invalid data format" |

### Which Option to Choose?

- **Use Option 1 (wrappers)** if you want minimal code changes during migration
- **Use Option 2 (try/catch)** for new code or if you prefer standard JavaScript error handling
- **Mix both approaches** - use wrappers for existing code, try/catch for new features

## Common Gotchas

1. **Schema Differences**: 
   - `team` table → `organizations` table
   - `team_id` → `organization_id`
   - `status` → `isActive` boolean

2. **Error Handling**:
   - **Supabase**: Returns `{ data, error }`
   - **AWS Option 1**: Use wrapper functions for same behavior
   - **AWS Option 2**: Use try/catch with exceptions

3. **Query Syntax**:
   - **Supabase**: `.eq('field', value)`
   - **Drizzle**: `eq(table.field, value)`

4. **Single vs Multiple Records**:
   - **Supabase**: `.single()` method
   - **AWS**: Use `safeSingle()` wrapper or check array length

5. **Real-time**:
   - WebSocket connections need manual reconnection
   - SSE is simpler but one-way only

This migration maintains all your existing functionality while giving you full control over your AWS infrastructure and **backward compatibility with your existing error handling patterns**.
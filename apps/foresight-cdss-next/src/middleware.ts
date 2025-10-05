import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Reserved subdomains that should not be treated as team slugs
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'staging',
  'admin',
  'support',
  'mail',
  'ftp',
  'app',
  'dashboard'
];

// Only match /api/*, but exclude /api/webhooks in logic
const isUnauthenticatedRoute = createRouteMatcher([
  "/(login|signup|forgot-password|reset-password)(.*)"
]);

// Routes that should be accessible to authenticated users even without team membership
const isOnboardingRoute = createRouteMatcher([
  "/onboard(.*)",
  "/api/teams(.*)",
  "/api/upload(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Skip webhook routes entirely
  if (req.url.includes("/api/webhooks")) {
    return NextResponse.next();
  }

  // SUBDOMAIN ROUTING LOGIC
  // Only process subdomains in production or when not using localhost
  if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('.local')) {
    const parts = hostname.split('.');

    // Handle cases like staging.api.have-foresight.app
    if (parts.length >= 4 && parts[1] === 'api') {
      // This is an API subdomain (staging.api, etc.) - pass through
      return NextResponse.next();
    }

    // Handle cases like api.have-foresight.app, staging.have-foresight.app
    if (parts.length >= 3) {
      const subdomain = parts[0];

      // Skip reserved subdomains and root domain
      if (!RESERVED_SUBDOMAINS.includes(subdomain) &&
          subdomain !== 'have-foresight' &&
          subdomain !== 'www') {

        // This looks like a team subdomain - validate it exists
        const teamSlug = subdomain;

        try {
          // Create Supabase client for middleware
          const supabase = await createSupabaseServerClient();

          // Check if team with this slug exists
          const { data: team, error } = await supabase
            .from('team')
            .select('id, slug, name')
            .eq('slug', teamSlug)
            .eq('is_active', true)
            .single();

          if (error || !team) {
            // Team doesn't exist - redirect to main site with error
            const redirectUrl = new URL('https://have-foresight.app/team-not-found');
            redirectUrl.searchParams.set('slug', teamSlug);
            return NextResponse.redirect(redirectUrl);
          }

          // Team exists - rewrite URL to include team context
          // Rewrite subdomain.have-foresight.app/path -> have-foresight.app/team/[slug]/path
          url.pathname = `/team/${teamSlug}${url.pathname}`;

          // Continue with Clerk auth logic but with rewritten URL
          const response = await handleClerkAuth(auth, req, url);

          // Add team info to headers for use in pages
          if (response.headers) {
            response.headers.set('x-team-slug', teamSlug);
            response.headers.set('x-team-id', team.id);
            response.headers.set('x-team-name', team.name);
          }

          return response;

        } catch (error) {
          console.error('Error validating team subdomain:', error);
          // On error, redirect to main site
          return NextResponse.redirect(new URL('https://have-foresight.app/error'));
        }
      }
    }
  }

  // REGULAR CLERK AUTH LOGIC (no subdomain or reserved subdomain)
  return handleClerkAuth(auth, req, url);
});

// Extracted Clerk auth logic to reuse
async function handleClerkAuth(auth: any, req: any, url?: any) {
  const { sessionClaims, isAuthenticated } = await auth({
    treatPendingAsSignedOut: false
  });

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isUnauthenticatedRoute(req)) {
    console.log("Redirecting authenticated user from auth page to dashboard");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && !isUnauthenticatedRoute(req)) {
    console.log("Redirecting unauthenticated user to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if authenticated user needs team onboarding
  if (isAuthenticated && !isUnauthenticatedRoute(req) && !isOnboardingRoute(req)) {
    try {
      const supabase = await createSupabaseServerClient();
      const { userId } = await auth();
      
      // Check if user has an active team membership
      const { data: membership } = await supabase
        .from('team_member')
        .select('team_id, role, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // If no active team membership, redirect to onboarding
      if (!membership) {
        console.log("Redirecting user without team to onboarding");
        return NextResponse.redirect(new URL("/onboard", req.url));
      }
    } catch (error) {
      // On database error, allow request to continue
      console.error('Error checking team membership:', error);
    }
  }

  // Add team context to API requests
  if (req.url.includes("/api/") && isAuthenticated) {
    const headers = new Headers(req.headers);
    if (sessionClaims?.team_id) {
      headers.set("x-team-id", sessionClaims.team_id as string);
    }

    // If this was a rewrite request, use the rewritten URL
    if (url && url !== req.nextUrl) {
      return NextResponse.rewrite(url, { request: { headers } });
    }

    return NextResponse.next({ request: { headers } });
  }

  // If this was a rewrite request (from subdomain), use the rewritten URL
  if (url && url !== req.nextUrl) {
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

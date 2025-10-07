import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/server";

// Only match auth routes
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
  // Skip webhook routes entirely
  if (req.url.includes("/api/webhooks")) {
    return NextResponse.next();
  }

  // PATH-BASED TEAM ROUTING
  // Check if this is a team route (/team/[slug]/*)
  const pathSegments = req.nextUrl.pathname.split('/');
  if (pathSegments[1] === 'team' && pathSegments[2]) {
    const teamSlug = pathSegments[2];

    try {
      // Create Supabase client for middleware
      const supabase = await createSupabaseMiddlewareClient();

      // Check if team with this slug exists
      const { data: team, error } = await supabase
        .from('team')
        .select('id, slug, name, status')
        .eq('slug', teamSlug)
        .eq('status', 'active')
        .single();

      if (error || !team) {
        // Team doesn't exist - redirect to team-not-found page
        return NextResponse.redirect(new URL(`/team-not-found?slug=${teamSlug}`, req.url));
      }

      // Team exists - continue with Clerk auth logic
      const response = await handleClerkAuth(auth, req);

      // Add team info to headers for use in pages
      if (response.headers) {
        response.headers.set('x-team-slug', teamSlug);
        response.headers.set('x-team-id', team.id);
        response.headers.set('x-team-name', team.name);
      }

      return response;

    } catch (error) {
      console.error('Error validating team:', error);
      // On error, redirect to error page
      return NextResponse.redirect(new URL('/error', req.url));
    }
  }

  // REGULAR CLERK AUTH LOGIC
  return handleClerkAuth(auth, req);
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
      const { userId } = await auth();

      if (userId) {
        const supabase = await createSupabaseMiddlewareClient();

        // Check if user has an active team membership
        const { data: membership } = await supabase
          .from('team_member')
          .select('team_id, role, status')
          .eq('clerk_user_id', userId)
          .eq('status', 'active')
          .single();

        // If no active team membership, redirect to onboarding
        if (!membership) {
          console.log("Redirecting user without team to onboarding");
          return NextResponse.redirect(new URL("/onboard", req.url));
        }
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

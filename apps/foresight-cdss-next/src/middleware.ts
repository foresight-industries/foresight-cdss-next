import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/server";
import { shouldRedirectToTeam, createTeamPath } from "@/lib/team-routing";

// Only match auth routes
const isUnauthenticatedRoute = createRouteMatcher([
  "/(login|logout|signup|forgot-password|reset-password|confirm-email|error|unauthorized|team-not-found)(.*)"
]);

// Routes that should be accessible to authenticated users even without team membership
const isOnboardingRoute = createRouteMatcher([
  "/onboard(.*)",
  "/accept-invitation(.*)",
  "/logout(.*)",
  "/api/auth/signout(.*)",
  "/api/auth/handle-magic-link(.*)",
  "/api/teams(.*)",
  "/api/upload(.*)",
  "/api/invitations(.*)",
  "/api/auth/signout(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip webhook routes and monitoring routes entirely
  if (req.url.includes("/api/webhooks") || req.nextUrl.pathname === "/monitoring") {
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

      // Team exists - continue with Clerk auth logic and verify membership
      const response = await handleClerkAuth(auth, req, null, { team, teamSlug });

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
async function handleClerkAuth(auth: any, req: any, url?: any, teamContext?: { team: any, teamSlug: string }) {
  const { sessionClaims, isAuthenticated } = await auth({
    treatPendingAsSignedOut: false
  });

  // If user is authenticated and trying to access auth pages, redirect to their team or dashboard
  if (isAuthenticated && isUnauthenticatedRoute(req)) {
    try {
      const { userId } = await auth();
      if (userId) {
        const { shouldRedirect, teamSlug } = await shouldRedirectToTeam(userId, '/');
        if (shouldRedirect && teamSlug) {
          console.log("Redirecting authenticated user from auth page to team dashboard");
          return NextResponse.redirect(new URL(`/team/${teamSlug}`, req.url));
        }
      }
    } catch (error) {
      console.error('Error checking team for auth redirect:', error);
    }

    console.log("Redirecting authenticated user from auth page to dashboard");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && !isUnauthenticatedRoute(req)) {
    console.log("Redirecting unauthenticated user to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if authenticated user needs team onboarding or team redirection
  if (isAuthenticated && !isUnauthenticatedRoute(req) && !isOnboardingRoute(req)) {
    try {
      const { userId } = await auth();

      if (userId) {
        // Check if user should be redirected to their team route
        const { shouldRedirect, teamSlug } = await shouldRedirectToTeam(
          userId,
          req.nextUrl.pathname
        );

        if (shouldRedirect && teamSlug) {
          const teamPath = createTeamPath(teamSlug, req.nextUrl.pathname);
          console.log(`Redirecting user to team route: ${teamPath}`);
          return NextResponse.redirect(new URL(teamPath, req.url));
        }

        // If not redirecting to team, check for team membership for onboarding
        const supabase = await createSupabaseMiddlewareClient();

        // Check if user has an active team membership
        const { data: membership } = await supabase
          .from('team_member')
          .select('team_id, role, status')
          .eq('clerk_user_id', userId)
          .eq('status', 'active')
          .single();

        // If no active team membership and no Clerk org, redirect to onboarding
        if (!membership && !teamSlug) {
          console.log("Redirecting user without team to onboarding");
          return NextResponse.redirect(new URL("/onboard", req.url));
        }
      }
    } catch (error) {
      // On database error, allow request to continue
      console.error('Error checking team membership:', error);
    }
  }

  // TEAM ROUTE SECURITY: Validate team membership and set headers
  if (teamContext && isAuthenticated) {
    try {
      const { userId } = await auth();

      if (userId) {
        const supabase = await createSupabaseMiddlewareClient();

        // Verify user has active membership to this specific team
        const { data: membership } = await supabase
          .from('team_member')
          .select('team_id, role, status')
          .eq('clerk_user_id', userId)
          .eq('team_id', teamContext.team.id)
          .eq('status', 'active')
          .single();

        if (!membership) {
          // User is not a member of this team - redirect to unauthorized or onboarding
          console.log(`User ${userId} attempted to access team ${teamContext.teamSlug} without membership`);
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // User is authenticated and has valid team membership - set secure headers
        const response = NextResponse.next();
        response.headers.set('x-team-slug', teamContext.teamSlug);
        response.headers.set('x-team-id', teamContext.team.id);
        response.headers.set('x-team-name', teamContext.team.name);
        response.headers.set('x-user-role', membership.role);

        return response;
      }
    } catch (error) {
      console.error('Error validating team membership:', error);
      return NextResponse.redirect(new URL('/error', req.url));
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

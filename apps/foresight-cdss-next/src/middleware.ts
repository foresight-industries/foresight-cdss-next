import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createDatabaseAdminClient, safeSingle } from "@/lib/aws/database";
import { shouldRedirectToTeam, createTeamPath } from "@/lib/team-routing";
import { eq, and } from "drizzle-orm";
import { organizations, teamMembers } from "@foresight-cdss-next/db";

// Only match auth routes
const isUnauthenticatedRoute = createRouteMatcher([
  "/(login|signup|forgot-password|reset-password|confirm-email|error|unauthorized|team-not-found)(.*)"
]);

// Routes that should be accessible to authenticated users even without team membership
const isOnboardingRoute = createRouteMatcher([
  "/onboard(.*)",
  "/accept-invitation(.*)",
  "/logout(.*)",
  "/api/auth/handle-magic-link(.*)",
  "/api/teams(.*)",
  "/api/upload(.*)",
  "/api/invitations(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip webhook routes and monitoring routes entirely
  if (req.url.includes("/api/webhooks") || req.nextUrl.pathname === "/monitoring" || req.url.includes("/logout")) {
    return NextResponse.next();
  }

  // PATH-BASED TEAM ROUTING
  // Check if this is a team route (/team/[slug]/*)
  const pathSegments = req.nextUrl.pathname.split('/');
  if (pathSegments[1] === 'team' && pathSegments[2]) {
    const teamSlug = pathSegments[2];

    try {
      // Create AWS database client for middleware
      const { db } = createDatabaseAdminClient();

      // Check if organization with this slug exists
      const { data: organization } = await safeSingle(async () =>
        db.select({
          id: organizations.id,
          slug: organizations.slug,
          name: organizations.name,
          deletedAt: organizations.deletedAt
        })
        .from(organizations)
        .where(eq(organizations.slug, teamSlug))
      );

      if (!organization) {
        // Organization doesn't exist - redirect to team-not-found page
        return NextResponse.redirect(new URL(`/team-not-found?slug=${teamSlug}`, req.url));
      }

      const organizationData = organization as { id: string; slug: string; name: string; deletedAt: Date | null };

      if (organizationData.deletedAt) {
        // Organization is deleted - redirect to team-not-found page
        return NextResponse.redirect(new URL(`/team-not-found?slug=${teamSlug}`, req.url));
      }

      // Organization exists - continue with Clerk auth logic and verify membership
      const response = await handleClerkAuth(auth, req, null, { organization, teamSlug });

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
async function handleClerkAuth(auth: any, req: any, url?: any, teamContext?: { organization: any, teamSlug: string }) {
  const { sessionClaims, userId, isAuthenticated } = await auth({
    treatPendingAsSignedOut: false
  });

  // If user is authenticated and trying to access auth pages, redirect to their team or dashboard
  if (isAuthenticated && isUnauthenticatedRoute(req)) {
    try {
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

        // If not redirecting to team, check for organization membership for onboarding
        const { db } = createDatabaseAdminClient();

        // Check if user has an active organization membership
        const { data: membership } = await safeSingle(async () =>
          db.select({
            organizationId: teamMembers.organizationId,
            role: teamMembers.role,
            isActive: teamMembers.isActive
          })
          .from(teamMembers)
          .where(and(
            eq(teamMembers.clerkUserId, userId),
            eq(teamMembers.isActive, true)
          ))
        );

        // If no active organization membership and no Clerk org, redirect to onboarding
        if (!membership && !teamSlug) {
          console.log("Redirecting user without organization to onboarding");
          return NextResponse.redirect(new URL("/onboard", req.url));
        }
      }
    } catch (error) {
      // On database error, allow request to continue
      console.error('Error checking team membership:', error);
    }
  }

  // ORGANIZATION ROUTE SECURITY: Validate organization membership and set headers
  if (teamContext && isAuthenticated) {
    try {
      if (userId) {
        const { db } = createDatabaseAdminClient();

        // Verify user has active membership to this specific organization
        const { data: membership } = await safeSingle(async () =>
          db.select({
            organizationId: teamMembers.organizationId,
            role: teamMembers.role,
            isActive: teamMembers.isActive
          })
          .from(teamMembers)
          .where(and(
            eq(teamMembers.clerkUserId, userId),
            eq(teamMembers.organizationId, teamContext.organization.id),
            eq(teamMembers.isActive, true)
          ))
        );

        if (!membership) {
          // User is not a member of this organization - redirect to unauthorized or onboarding
          console.log(`User ${userId} attempted to access organization ${teamContext.teamSlug} without membership`);
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        const membershipData = membership as { organizationId: string; role: string; isActive: boolean };

        // User is authenticated and has valid organization membership - set secure headers
        const response = NextResponse.next();
        response.headers.set('x-team-slug', teamContext.teamSlug);
        response.headers.set('x-team-id', teamContext.organization.id);
        response.headers.set('x-team-name', teamContext.organization.name);
        response.headers.set('x-user-role', membershipData.role);

        return response;
      }
    } catch (error) {
      console.error('Error validating organization membership:', error);
      return NextResponse.redirect(new URL('/error', req.url));
    }
  }

  // Add organization context to API requests
  if (req.url.includes("/api/") && isAuthenticated) {
    const headers = new Headers(req.headers);
    if (sessionClaims?.organization_id) {
      headers.set("x-organization-id", sessionClaims.organization_id as string);
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

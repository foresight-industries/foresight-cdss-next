import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only match /api/*, but exclude /api/webhooks in logic
const isUnauthenticatedRoute = createRouteMatcher([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip webhook routes entirely
  if (req.url.includes("/api/webhooks")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userId && isUnauthenticatedRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and trying to access protected routes
  if (!userId && !isUnauthenticatedRoute(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Add team context to API requests
  if (req.url.includes("/api/") && userId) {
    const headers = new Headers(req.headers);
    if (sessionClaims?.team_id) {
      headers.set("x-team-id", sessionClaims.team_id as string);
    }
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

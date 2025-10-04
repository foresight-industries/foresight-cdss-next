// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/(?!webhooks)(.*)", // Protect API routes except webhooks
]);

export default clerkMiddleware(async (auth, req) => {
  // For protected routes, ensure user is authenticated
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Add team context to headers for API routes
    if (req.url.includes("/api/")) {
      const headers = new Headers(req.headers);

      // If team_id is in session claims (set via Clerk metadata)
      if (sessionClaims?.team_id) {
        headers.set("x-team-id", sessionClaims.team_id as string);
      }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

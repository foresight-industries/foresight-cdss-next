// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only match /api/*, but exclude /api/webhooks in logic
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Exclude /api/webhooks from protection
  if (isProtectedRoute(req) && !req.url.includes("/api/webhooks")) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (req.url.includes("/api/")) {
      const headers = new Headers(req.headers);
      if (sessionClaims?.team_id) {
        headers.set("x-team-id", sessionClaims.team_id as string);
      }
      return NextResponse.next({ request: { headers } });
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

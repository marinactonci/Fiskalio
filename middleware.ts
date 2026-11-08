import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/bills(.*)",
  "/stats(.*)",
  "/account(.*)",
]);

const clerk = clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  // Send signed-out visitors to our own pages, not Clerk's hosted portal.
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // /newtab opens on every new browser tab (extension/). Its session token has
  // usually expired by then, and the middleware would answer with a round of
  // Clerk handshake redirects first. The page needs no server auth: it signs
  // in through clerk-js in the browser, so skip the middleware and load fast.
  if (req.nextUrl.pathname === "/newtab") return NextResponse.next();
  return clerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

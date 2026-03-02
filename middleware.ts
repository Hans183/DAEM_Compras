import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get all cookies for debugging
  const allCookies = request.cookies.getAll();
  console.log("🔍 Middleware - Pathname:", pathname);
  console.log(
    "🍪 All cookies:",
    allCookies.map((c) => c.name),
  );

  // Get the pb_auth cookie
  const authCookie = request.cookies.get("pb_auth");
  console.log("🔐 pb_auth cookie:", authCookie ? "EXISTS" : "MISSING");

  // Validate if user is authenticated
  const isAuthenticated = authCookie?.value && authCookie.value !== "";
  console.log("✅ Is authenticated:", isAuthenticated);

  // Define public paths that don't require authentication
  const publicPaths = ["/auth", "/not-found", "/unauthorized"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Allow root path without authentication
  const isRootPath = pathname === "/";

  console.log("📍 Is public path:", isPublicPath, "| Is root:", isRootPath);

  // If trying to access protected route without auth, redirect to login
  if (!isPublicPath && !isRootPath && !isAuthenticated) {
    console.log("🚫 BLOCKING - Redirecting to login");
    const loginUrl = new URL("/auth/login", request.url);
    // Add return URL as query parameter for post-login redirect
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && pathname.startsWith("/auth")) {
    console.log("🔄 Redirecting authenticated user from auth to dashboard");
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If authenticated and on root path, redirect to dashboard
  if (isAuthenticated && isRootPath) {
    console.log("🔄 Redirecting authenticated user from root to dashboard");
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  console.log("✅ Allowing request to proceed");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

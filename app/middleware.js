import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/_next",
  "/favicon.ico"
];

/**
 * Checks if the requested path is a public route that doesn't require authentication.
 */
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Middleware that protects routes by checking authentication status.
 * Redirects unauthenticated users to login for protected routes.
 */
export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicRoute(pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
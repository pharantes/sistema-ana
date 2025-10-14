import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow internal and public paths through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Get authentication token
  const token = await getToken({ req, secret: globalThis.process?.env?.NEXTAUTH_SECRET });

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (pathname === "/login" && token) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow login page for unauthenticated users
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // For other app routes, check auth token and redirect to login when missing
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

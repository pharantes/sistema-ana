import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

  // DEBUG: Log the pathname and token status
  console.log('Middleware - Path:', pathname, 'Has Token:', !!token);

  // Allow ALL NextAuth.js routes without any restrictions
  if (pathname.startsWith("/api/auth/")) {
    console.log('Middleware - Allowing NextAuth route:', pathname);
    return NextResponse.next();
  }

  // Allow public assets
  if (
    pathname.includes("/_next/") ||
    pathname.includes("/favicon.ico") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // Protect API routes (except auth) and the acoes page
  if ((pathname.startsWith("/api/") || pathname.startsWith("/acoes")) && !token) {
    console.log('Middleware - Blocking unauthorized access to:', pathname);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/acoes/:path*"
  ],
};
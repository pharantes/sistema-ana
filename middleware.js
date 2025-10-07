import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow requests for public files, next internals and all /api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // Check NextAuth JWT; relies on NEXTAUTH_SECRET
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const authenticated = Boolean(token);

  if (!authenticated) {
    // redirect unauthenticated users to the login page
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static/_next and api is handled above
  matcher: ["/((?!_next/static|_next/image).*)"],
};

import { NextResponse } from "next/server";

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

  // Simple cookie-based auth check: look for 'auth' cookie
  // In middleware (Edge runtime) use req.cookies.get(name)
  let authenticated = false;
  try {
    const cookie = req.cookies.get("auth");
    if (cookie && cookie.value) {
      authenticated = true;
    }
  } catch (e) {
    // ignore
  }

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

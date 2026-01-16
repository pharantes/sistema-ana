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

  // If user is authenticated and trying to access login page, redirect based on role
  if (pathname === "/login" && token) {
    const redirectUrl = req.nextUrl.clone();
    // Staff goes to /acoes, admin goes to dashboard
    redirectUrl.pathname = token.role === "staff" ? "/acoes" : "/";
    return NextResponse.redirect(redirectUrl);
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

  // Staff role restrictions: only allow access to /acoes, /colaboradores, /clientes, /documentation
  if (token.role === "staff") {
    const staffAllowedPaths = ["/acoes", "/colaboradores", "/clientes", "/documentation"];
    const isAllowedPath = staffAllowedPaths.some(path => pathname.startsWith(path));

    // If trying to access restricted route, redirect to /acoes
    if (!isAllowedPath && pathname !== "/") {
      const acoesUrl = req.nextUrl.clone();
      acoesUrl.pathname = "/acoes";
      return NextResponse.redirect(acoesUrl);
    }

    // Redirect homepage to /acoes for staff
    if (pathname === "/") {
      const acoesUrl = req.nextUrl.clone();
      acoesUrl.pathname = "/acoes";
      return NextResponse.redirect(acoesUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

"use client";
import { SessionProvider } from "next-auth/react";

/**
 * Wraps the SessionProvider from next-auth to enable client-side session access.
 */
export default function NextAuthProvider({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
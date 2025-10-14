// app/layout.js
import './globals.css';
import { getServerSession } from "next-auth";
import baseOptions from "../lib/auth/authOptionsBase";
import NextAuthProvider from "./sessionProvider";
import NavBar from "./NavBar";
import ErrorBoundary from "./components/ErrorBoundary";

/**
 * Root layout component that wraps the entire application with authentication and navigation.
 * Fetches session data on the server side and passes it to client components.
 */
export default async function RootLayout({ children }) {
  const session = await getServerSession(baseOptions);

  return (
    <html lang="pt-BR">
      <body>
        <NextAuthProvider session={session}>
          <ErrorBoundary>
            <NavBar />
            {children}
          </ErrorBoundary>
        </NextAuthProvider>
      </body>
    </html>
  );
}
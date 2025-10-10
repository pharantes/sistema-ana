// app/layout.js
import { getServerSession } from "next-auth";
import baseOptions from "../lib/auth/authOptionsBase";
import NextAuthProvider from "./sessionProvider"; // Your client component
import NavBar from "./NavBar";

export default async function RootLayout({ children }) {
  // Get session on the server side
  const session = await getServerSession(baseOptions);

  return (
    <html lang="pt-BR">
      <body>
        <NextAuthProvider session={session}> {/* Pass session here */}
          <NavBar />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
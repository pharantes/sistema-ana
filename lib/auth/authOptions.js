import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use CJS require to avoid ESM/CJS interop issues with next-auth provider exports
const CredentialsProvider = require('next-auth/providers/credentials');
import bcrypt from "bcryptjs";
import dbConnect from "../mongoose";
import User from "../db/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials || {};
        if (!username || !password) return null;

        // Ensure mongoose connection
        await dbConnect();

        const user = await User.findOne({ username }).lean();
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Return sanitized user
        return {
          id: user._id.toString(),
          username: user.username,
          name: user.name || user.username,
          role: user.role || "staff",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: globalThis.process?.env?.NEXTAUTH_SECRET,
};

export default authOptions;

import NextAuth from "next-auth";
import _CredentialsProvider from "next-auth/providers/credentials";

// normalize provider import shape across different bundlers/packagers
let CredentialsProvider;
if (typeof _CredentialsProvider === 'function') {
  CredentialsProvider = _CredentialsProvider;
} else if (_CredentialsProvider && typeof _CredentialsProvider.default === 'function') {
  CredentialsProvider = _CredentialsProvider.default;
} else if (_CredentialsProvider && typeof _CredentialsProvider.Credentials === 'function') {
  CredentialsProvider = _CredentialsProvider.Credentials;
} else if (_CredentialsProvider && _CredentialsProvider.default && typeof _CredentialsProvider.default.default === 'function') {
  CredentialsProvider = _CredentialsProvider.default.default;
} else {
  throw new Error('Unable to resolve CredentialsProvider from next-auth/providers/credentials import');
}
import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/db/connect.js";
import User from "../../../../lib/db/models/User.js";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ username: credentials.username });
        if (!user) throw new Error("No user found with the username");
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) throw new Error("Invalid password");
        return {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
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
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

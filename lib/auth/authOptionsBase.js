import bcrypt from "bcryptjs";
import dbConnect from "../mongoose";
import User from "../db/models/User";

export const authorizeUser = async (credentials) => {
  const { username, password } = credentials || {};
  if (!username || !password) return null;

  await dbConnect();
  const user = await User.findOne({ username }).lean();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return { id: user._id.toString(), username: user.username, name: user.name || user.username, role: user.role || 'staff' };
};

const base = {
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

export default base;

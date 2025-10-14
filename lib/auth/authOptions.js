import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use CJS require to avoid ESM/CJS interop issues with next-auth provider exports
const CredentialsProvider = require('next-auth/providers/credentials');
import bcrypt from "bcryptjs";
import dbConnect from "../mongoose";
import User from "../db/models/User";

/**
 * Validates username and password credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {boolean} Whether credentials are valid
 */
function areCredentialsValid(username, password) {
  return Boolean(username && password);
}

/**
 * Creates a sanitized user object for authentication
 * @param {Object} userDocument - MongoDB user document
 * @returns {Object} Sanitized user object
 */
function createSanitizedUser(userDocument) {
  return {
    id: userDocument._id.toString(),
    username: userDocument.username,
    name: userDocument.name || userDocument.username,
    role: userDocument.role || "staff",
  };
}

/**
 * Verifies password against stored hash
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Whether password is valid
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Authorizes user credentials and returns sanitized user object
 * @param {Object} credentials - User credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Promise<Object|null>} Sanitized user or null if invalid
 */
async function authorizeCredentials(credentials) {
  const { username, password } = credentials || {};

  if (!areCredentialsValid(username, password)) {
    return null;
  }

  // Ensure mongoose connection
  await dbConnect();

  const userDocument = await User.findOne({ username }).lean();
  if (!userDocument) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, userDocument.password);
  if (!isPasswordValid) {
    return null;
  }

  return createSanitizedUser(userDocument);
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return await authorizeCredentials(credentials);
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

import { getServerSession } from "next-auth";
import baseOptions from "../auth/authOptionsBase";

/**
 * Ensures the current session has at least the required role.
 * Throws an Error if not authorized.
 */
export async function requireRole(req, res, required = "user") {
  const session = await getServerSession(req, res, baseOptions);

  if (!session || !session.user) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }

  // roles: admin > manager > user
  const hierarchy = ["user", "manager", "admin"];
  const userRole = session.user.role || "user";

  if (hierarchy.indexOf(userRole) < hierarchy.indexOf(required)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return session.user;
}

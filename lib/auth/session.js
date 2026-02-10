import { getServerSession } from 'next-auth';
import baseOptions from './authOptionsBase';
import { unauthorized, forbidden } from '../api/responses';

/**
 * Validates user session for app router
 * @returns {Promise<{session: Object|null, error: Response|null}>}
 */
export async function getValidatedSession() {
  const session = await getServerSession(baseOptions);
  if (!session || !session.user) {
    return { session: null, error: unauthorized() };
  }
  return { session, error: null };
}

/**
 * Validates admin session for app router
 * @returns {Promise<{session: Object|null, error: Response|null}>}
 */
export async function getValidatedAdminSession() {
  const session = await getServerSession(baseOptions);
  if (!session || !session.user) {
    return { session: null, error: unauthorized() };
  }
  if (session.user.role !== 'admin') {
    return { session: null, error: forbidden() };
  }
  return { session, error: null };
}

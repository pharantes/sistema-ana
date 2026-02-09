/* eslint-env node */
import { getServerSession } from "next-auth/next";
import baseOptions from "../../../lib/auth/authOptionsBase";
import dbConnect from "../../../lib/db/connect.js";
import Action from "../../../lib/db/models/Action.js";
import ContasAPagar from "../../../lib/db/models/ContasAPagar.js";
import {
  buildActionsQuery,
  enrichActionsWithClientName,
  narrowStaffByQuery,
  normalizeCostsArray,
  normalizeStaffArray,
} from "../../../lib/helpers/actions.js";
import { validateActionCreate } from "../../../lib/validators/action.js";
import { ok, created, badRequest, unauthorized, serverError } from "../../../lib/api/responses";
import { toPlainDocs, toPlainDoc } from "../../../lib/utils/mongo";
import { rateLimit } from "../../../lib/utils/rateLimit";
import { parseActionsQuery } from "../../../lib/validators/actionsQuery";

// Rate limiter configuration
const getClientIdentifier = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';

const getLimiter = rateLimit({ windowMs: 10_000, limit: 40, idFn: getClientIdentifier });
const postLimiter = rateLimit({ windowMs: 10_000, limit: 20, idFn: getClientIdentifier });

function logError(message, error) {
  try {
    process.stderr.write(`${message}: ${String(error)}\n`);
  } catch {
    // Ignore logging errors
  }
}

function getSearchParams(request) {
  return request.nextUrl?.searchParams ?? new globalThis.URL(request.url).searchParams;
}

/**
 * Retrieves and validates the user session.
 */
async function getValidatedSession() {
  const session = await getServerSession(baseOptions);
  if (!session) {
    return { error: unauthorized() };
  }
  return { session };
}

/**
 * Fetches actions from database with query filters and enrichment.
 */
async function fetchActionsWithFilters(searchParams) {
  parseActionsQuery(searchParams);
  const { query, q } = await buildActionsQuery(searchParams);

  const actions = await Action.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  await enrichActionsWithClientName(actions);
  narrowStaffByQuery(actions, q);

  return actions;
}

/**
 * GET handler - Retrieves actions list with optional filtering.
 */
export async function GET(request) {
  try {
    const { error } = await getValidatedSession();
    if (error) return error;

    getLimiter.check(request);
    await dbConnect();

    const searchParams = getSearchParams(request);

    try {
      const actions = await fetchActionsWithFilters(searchParams);
      return ok(toPlainDocs(actions));
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid query');
    }
  } catch (error) {
    logError('Error fetching actions', error);
    return serverError('Internal Server Error');
  }
}

/**
 * Normalizes date fields in the action payload.
 */
function normalizeDates(payload) {
  const normalized = { ...payload };

  if (normalized.date) {
    normalized.date = new Date(normalized.date);
  } else {
    normalized.date = new Date();
  }

  if (normalized.startDate) normalized.startDate = new Date(normalized.startDate);
  if (normalized.endDate) normalized.endDate = new Date(normalized.endDate);
  if (normalized.dueDate) normalized.dueDate = new Date(normalized.dueDate);

  return normalized;
}

/**
 * Normalizes staff and costs arrays in the action payload.
 */
function normalizeActionArrays(payload) {
  const normalized = { ...payload };

  if (normalized.staff) {
    normalized.staff = normalizeStaffArray(normalized.staff);
  }

  if (normalized.costs) {
    normalized.costs = normalizeCostsArray(normalized.costs);
  }

  return normalized;
}

/**
 * Validates if a staff member has a valid name for ContasAPagar creation
 */
function isValidStaffForPayment(staffMember) {
  return staffMember &&
    typeof staffMember.name === 'string' &&
    staffMember.name.trim().length > 0;
}

/**
 * Creates ContasAPagar entries for staff members.
 */
function createStaffPaymentOperations(action, reportDate) {
  const staff = Array.isArray(action.staff) ? action.staff : [];

  // Filter staff with valid names only
  const validStaff = staff.filter(isValidStaffForPayment);

  if (staff.length > 0 && validStaff.length === 0) {
    throw new Error(`Action ${action._id}: All staff entries have invalid names`);
  }

  if (validStaff.length < staff.length) {
    const invalidCount = staff.length - validStaff.length;
    logError(`Action ${action._id}: ${invalidCount} staff entries skipped due to invalid names`, new Error('Invalid staff names'));
  }

  return validStaff.map((staffMember) => ({
    updateOne: {
      filter: { actionId: action._id, staffName: staffMember.name.trim() },
      update: {
        $setOnInsert: {
          status: 'ABERTO',
          actionId: action._id,
          staffName: staffMember.name.trim()
        },
        $set: {
          reportDate,
          colaboradorId: staffMember.colaboradorId || undefined
        }
      },
      upsert: true,
    }
  }));
}

/**
 * Creates ContasAPagar entries for action costs.
 */
function createCostPaymentOperations(action, reportDate) {
  const costs = Array.isArray(action.costs) ? action.costs : [];

  return costs.map((cost) => ({
    updateOne: {
      filter: { actionId: action._id, costId: cost._id },
      update: {
        $setOnInsert: {
          status: 'ABERTO',
          actionId: action._id,
          costId: cost._id
        },
        $set: {
          reportDate,
          colaboradorId: cost.colaboradorId || undefined
        }
      },
      upsert: true,
    }
  }));
}

/**
 * Auto-creates ContasAPagar entries for action staff and costs.
 * Throws error if creation fails to prevent orphaned actions.
 */
async function createPaymentEntries(action) {
  const reportDate = action.dueDate || action.createdAt || new Date();

  try {
    const staffOperations = createStaffPaymentOperations(action, reportDate);
    const costOperations = createCostPaymentOperations(action, reportDate);
    const allOperations = [...staffOperations, ...costOperations];

    if (allOperations.length > 0) {
      const result = await ContasAPagar.bulkWrite(allOperations);
      logError(`Created ${result.upsertedCount || 0} ContasAPagar entries for action ${action._id}`, new Error('INFO'));
    } else if (Array.isArray(action.staff) && action.staff.length > 0) {
      // Action has staff but no operations created - this is an error
      throw new Error(`Failed to create payment operations for action ${action._id} with ${action.staff.length} staff members`);
    }
  } catch (error) {
    logError(`CRITICAL: Failed to create ContasAPagar entries for action ${action._id}`, error);
    // Re-throw error to prevent action creation without payment entries
    throw new Error(`Failed to create payment entries: ${error.message}`);
  }
}

/**
 * POST handler - Creates a new action.
 */
export async function POST(request) {
  try {
    const { session, error } = await getValidatedSession();
    if (error) return error;
    if (!session.user) return unauthorized();

    postLimiter.check(request);

    const body = await request.json();

    try {
      validateActionCreate(body);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    await dbConnect();

    let payload = normalizeDates(body);
    payload = normalizeActionArrays(payload);
    payload.createdBy = session.user.username || session.user.name || "unknown";

    const action = new Action(payload);
    await action.save();
    await createPaymentEntries(action);

    return created(toPlainDoc(action.toObject ? action.toObject() : action));
  } catch (error) {
    logError('Error creating action', error);
    return serverError('Failed to create action');
  }
}

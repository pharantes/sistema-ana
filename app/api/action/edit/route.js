/* eslint-env node */
import { getServerSession } from "next-auth";
import baseOptions from "../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import ContasAPagar from "../../../../lib/db/models/ContasAPagar.js";
import { normalizeCostsArray, normalizeStaffArray } from "../../../../lib/helpers/actions.js";
import { validateActionUpdate } from "../../../../lib/validators/action.js";
import { ok, badRequest, unauthorized, forbidden, serverError, notFound } from "../../../../lib/api/responses";
import { rateLimit } from "../../../../lib/utils/rateLimit";
import { toPlainDoc } from "../../../../lib/utils/mongo";
import { logInfo, logError } from "../../../../lib/utils/logger";

const getClientIdentifier = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';

const patchLimiter = rateLimit({ windowMs: 10_000, limit: 30, idFn: getClientIdentifier });

function extractStaffNames(action) {
  const staff = action.staff || [];
  return staff.map((staffMember) =>
    typeof staffMember === "string" ? staffMember : staffMember?.name
  ).filter(Boolean);
}

function checkStaffEditPermission(session, action) {
  const userRole = session.user.role;
  if (userRole === "admin" || userRole === "staff") {
    return {};
  }

  const staffNames = extractStaffNames(action);
  const hasPermission = staffNames.includes(session.user.username);

  if (!hasPermission) {
    return { error: forbidden() };
  }

  return {};
}

function normalizeDateFields(update) {
  const normalized = { ...update };

  if (normalized.date) normalized.date = new Date(normalized.date);
  if (normalized.startDate) normalized.startDate = new Date(normalized.startDate);
  if (normalized.endDate) normalized.endDate = new Date(normalized.endDate);
  if (normalized.dueDate) normalized.dueDate = new Date(normalized.dueDate);

  return normalized;
}

function normalizeActionFields(update) {
  let normalized = normalizeDateFields(update);

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

function createStaffUpsertOperations(action, reportDate) {
  const staff = Array.isArray(action.staff) ? action.staff : [];

  // Filter staff with valid names only
  const validStaff = staff.filter(isValidStaffForPayment);

  if (staff.length > 0 && validStaff.length === 0) {
    throw new Error(`Action ${action._id}: All staff entries have invalid names`);
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

function createCostUpsertOperations(action, reportDate) {
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

async function syncPaymentEntries(action) {
  const reportDate = action.dueDate || action.createdAt || new Date();
  const staff = Array.isArray(action.staff) ? action.staff : [];

  try {
    // Upsert staff payment entries
    const staffOperations = createStaffUpsertOperations(action, reportDate);
    if (staffOperations.length > 0) {
      const result = await ContasAPagar.bulkWrite(staffOperations);
      logInfo('syncPaymentEntries', `Synced ${result.upsertedCount || 0} staff payment entries for action ${action._id}`);
    }

    // Get valid staff names for cleanup (only staff with valid names)
    const validStaffNames = staff
      .filter(isValidStaffForPayment)
      .map(staffMember => staffMember.name.trim());

    // Remove entries for staff removed from action
    const deleteResult = await ContasAPagar.deleteMany({
      actionId: action._id,
      staffName: { $exists: true, $nin: validStaffNames }
    });

    if (deleteResult.deletedCount > 0) {
      logInfo('syncPaymentEntries', `Removed ${deleteResult.deletedCount} obsolete staff payment entries for action ${action._id}`);
    }

    // Upsert cost payment entries
    const costs = Array.isArray(action.costs) ? action.costs : [];
    const costIds = costs.map(cost => cost._id).filter(Boolean);
    const costOperations = createCostUpsertOperations(action, reportDate);

    if (costOperations.length > 0) {
      const costResult = await ContasAPagar.bulkWrite(costOperations);
      logInfo('syncPaymentEntries', `Synced ${costResult.upsertedCount || 0} cost payment entries for action ${action._id}`);
    }

    // Remove entries for costs removed from action
    const deleteCostResult = await ContasAPagar.deleteMany({
      actionId: action._id,
      costId: { $exists: true, $nin: costIds }
    });

    if (deleteCostResult.deletedCount > 0) {
      logInfo('syncPaymentEntries', `Removed ${deleteCostResult.deletedCount} obsolete cost payment entries for action ${action._id}`);
    }
  } catch (error) {
    logError('syncPaymentEntries', error);
    // Re-throw error to prevent action update without payment sync
    throw new Error(`Failed to sync payment entries: ${error.message}`);
  }
}

/**
 * PATCH handler - Updates an existing action.
 * Admins can edit any action, staff can only edit actions they're assigned to.
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) {
      return unauthorized();
    }

    patchLimiter.check(request);
    await dbConnect();

    const body = await request.json();

    try {
      validateActionUpdate(body);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    const { id, ...updateData } = body;
    const action = await Action.findById(id);

    if (!action) {
      return notFound('Action not found');
    }

    const { error: permissionError } = checkStaffEditPermission(session, action);
    if (permissionError) return permissionError;

    const normalizedUpdate = normalizeActionFields(updateData);
    Object.assign(action, normalizedUpdate);
    await action.save();

    await syncPaymentEntries(action);

    return ok(toPlainDoc(action.toObject ? action.toObject() : action));
  } catch (error) {
    return serverError(error?.message || 'Erro ao atualizar ação');
  }
}

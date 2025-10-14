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
  if (session.user.role === "admin") {
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

function createStaffUpsertOperations(action, reportDate) {
  const staff = Array.isArray(action.staff) ? action.staff : [];

  return staff.map((staffMember) => ({
    updateOne: {
      filter: { actionId: action._id, staffName: staffMember.name },
      update: {
        $setOnInsert: {
          status: 'ABERTO',
          actionId: action._id,
          staffName: staffMember.name
        },
        $set: { reportDate }
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
  try {
    const reportDate = action.dueDate || action.createdAt || new Date();
    const staff = Array.isArray(action.staff) ? action.staff : [];
    const staffNames = staff.map(staffMember => staffMember.name);

    // Upsert staff payment entries
    const staffOperations = createStaffUpsertOperations(action, reportDate);
    if (staffOperations.length > 0) {
      await ContasAPagar.bulkWrite(staffOperations);
    }

    // Remove entries for staff removed from action
    await ContasAPagar.deleteMany({
      actionId: action._id,
      staffName: { $nin: staffNames }
    });

    // Upsert cost payment entries
    const costs = Array.isArray(action.costs) ? action.costs : [];
    const costIds = costs.map(cost => cost._id);
    const costOperations = createCostUpsertOperations(action, reportDate);

    if (costOperations.length > 0) {
      await ContasAPagar.bulkWrite(costOperations);
    }

    // Remove entries for costs removed from action
    await ContasAPagar.deleteMany({
      actionId: action._id,
      costId: { $nin: costIds }
    });
  } catch {
    // Ignore sync errors
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

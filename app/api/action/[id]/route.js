/* eslint-env node */
import { getValidatedSession } from "@/lib/auth/session";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import Cliente from "../../../../lib/db/models/Cliente.js";
import ContasAPagar from "../../../../lib/db/models/ContasAPagar.js";
import { ok, badRequest, notFound, forbidden, serverError } from "../../../../lib/api/responses";
import { toPlainDoc } from "../../../../lib/utils/mongo";
import { rateLimit } from "../../../../lib/utils/rateLimit";
import { logError } from "../../../../lib/utils/logger";

// Rate limiter configuration
const getClientIdentifier = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';

const getLimiter = rateLimit({ windowMs: 10_000, limit: 40, idFn: getClientIdentifier });
const delLimiter = rateLimit({ windowMs: 10_000, limit: 20, idFn: getClientIdentifier });

function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || ''));
}

async function enrichActionWithClientName(action) {
  try {
    const clientId = String(action.client || '');

    if (!isValidObjectId(clientId)) {
      return;
    }

    const cliente = await Cliente.findById(clientId)
      .select('nome codigo')
      .lean()
      .exec();

    if (cliente) {
      const codigoPart = cliente.codigo ? `${cliente.codigo} ` : '';
      const nomePart = cliente.nome || '';
      action.clientName = `${codigoPart}${nomePart}`.trim();
    }
  } catch {
    // Ignore client resolution errors
  }
}

async function getActionParams(context) {
  const params = await context?.params;
  const { id } = params || {};

  if (!id) {
    return { error: badRequest("Missing id") };
  }

  return { id };
}

/**
 * GET handler - Retrieves a single action by ID with enriched client information.
 */
export async function GET(request, context) {
  try {
    const { error: sessionError } = await getValidatedSession();
    if (sessionError) return sessionError;

    getLimiter.check(request);

    const { id, error: paramsError } = await getActionParams(context);
    if (paramsError) return paramsError;

    await dbConnect();

    const action = await Action.findById(id).lean().exec();
    if (!action) {
      return notFound("Not found");
    }

    await enrichActionWithClientName(action);

    return ok(toPlainDoc(action));
  } catch (error) {
    logError('GET /api/action/[id] error', error);
    return serverError('Internal Server Error');
  }
}

async function cascadeDeletePaymentEntries(actionId) {
  try {
    await ContasAPagar.deleteMany({ actionId });
  } catch {
    // Ignore cascade delete errors
  }
}

function checkAdminPermission(session) {
  const userRole = session.user.role;
  if (userRole !== "admin" && userRole !== "staff") {
    return { error: forbidden() };
  }
  return {};
}

/**
 * DELETE handler - Deletes an action and its associated payment entries (admin and staff only).
 */
export async function DELETE(request, context) {
  try {
    const { session, error: sessionError } = await getValidatedSession();
    if (sessionError) return sessionError;

    delLimiter.check(request);

    const { error: permissionError } = checkAdminPermission(session);
    if (permissionError) return permissionError;

    const { id, error: paramsError } = await getActionParams(context);
    if (paramsError) return paramsError;

    await dbConnect();

    const deleted = await Action.findByIdAndDelete(id);
    if (!deleted) {
      return notFound("Not found");
    }

    await cascadeDeletePaymentEntries(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    logError('DELETE /api/action/[id] error', error);
    return serverError('Internal Server Error');
  }
}

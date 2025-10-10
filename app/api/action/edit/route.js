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

// normalization helpers moved to lib/helpers/actions.js

const idFn = (req) => req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'anon';
const patchLimiter = rateLimit({ windowMs: 10_000, limit: 30, idFn });

export async function PATCH(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();

    patchLimiter.check(request);

    await dbConnect();
    const body = await request.json();
    try { validateActionUpdate(body); } catch (e) { return badRequest(e.message || 'Invalid payload'); }
    const { id, ...update } = body;
    let action = await Action.findById(id);
    if (!action) return notFound('Action not found');

    if (session.user.role !== "admin") {
      // Staff can edit only if they are listed in staff entries (by name match)
      const names = (action.staff || []).map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean);
      if (!names.includes(session.user.username)) return forbidden();
    }

    if (update.date) update.date = new Date(update.date);
    if (update.startDate) update.startDate = new Date(update.startDate);
    if (update.endDate) update.endDate = new Date(update.endDate);
    if (update.dueDate) update.dueDate = new Date(update.dueDate);
    if (update.staff) update.staff = normalizeStaffArray(update.staff);
    if (update.costs) update.costs = normalizeCostsArray(update.costs);

    Object.assign(action, update);
    await action.save();
    // Sync contasapagar entries per colaborador
    try {
      const reportDate = action.dueDate || action.createdAt || new Date();
      const staff = Array.isArray(action.staff) ? action.staff : [];
      const names = staff.map(s => s.name);
      // Upsert for current staff
      const upserts = staff.map((s) => ({
        updateOne: {
          filter: { actionId: action._id, staffName: s.name },
          update: { $setOnInsert: { status: 'ABERTO', actionId: action._id, staffName: s.name }, $set: { reportDate } },
          upsert: true,
        }
      }));
      if (upserts.length) await ContasAPagar.bulkWrite(upserts);
      // Remove entries for staff removed from action
      await ContasAPagar.deleteMany({ actionId: action._id, staffName: { $nin: names } });
      // Upsert for extra costs
      const costs = Array.isArray(action.costs) ? action.costs : [];
      const costIds = costs.map(c => c._id);
      const upsertsCosts = costs.map((c) => ({
        updateOne: {
          filter: { actionId: action._id, costId: c._id },
          update: { $setOnInsert: { status: 'ABERTO', actionId: action._id, costId: c._id }, $set: { reportDate, colaboradorId: c.colaboradorId || undefined } },
          upsert: true,
        }
      }));
      if (upsertsCosts.length) await ContasAPagar.bulkWrite(upsertsCosts);
      // Remove entries for costs removed from action
      await ContasAPagar.deleteMany({ actionId: action._id, costId: { $nin: costIds } });
    } catch { /* ignore sync errors */ }
    return ok(toPlainDoc(action.toObject ? action.toObject() : action));
  } catch (e) {
    return serverError(e?.message || 'Erro ao atualizar ação');
  }
}

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

// helpers moved to lib/helpers/actions.js

const idFn = (req) => req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 40, idFn });

export async function GET(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session) return unauthorized();

    getLimiter.check(request);

    await dbConnect();
    const searchParams = request.nextUrl?.searchParams ?? new globalThis.URL(request.url).searchParams;
    // Validate pagination/sort and pass-through filters
    try { parseActionsQuery(searchParams); } catch (e) { return badRequest(e.message || 'Invalid query'); }
    const { query, q } = await buildActionsQuery(searchParams);

    const actions = await Action.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    await enrichActionsWithClientName(actions);
    narrowStaffByQuery(actions, q);

    return ok(toPlainDocs(actions));
  } catch (error) {
    try { process.stderr.write('Error fetching actions: ' + String(error) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Internal Server Error');
  }
}

const postLimiter = rateLimit({ windowMs: 10_000, limit: 20, idFn });

export async function POST(request) {
  // Create new action
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();

    postLimiter.check(request);

    const body = await request.json();
    try { validateActionCreate(body); } catch (e) { return badRequest(e.message || 'Invalid payload'); }
    await dbConnect();

    const payload = { ...body };
    if (payload.date) payload.date = new Date(payload.date);
    // Ensure creation date is always set; default to now when not provided by client
    if (!payload.date) payload.date = new Date();
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    if (payload.endDate) payload.endDate = new Date(payload.endDate);
    if (payload.dueDate) payload.dueDate = new Date(payload.dueDate);
    if (payload.staff) payload.staff = normalizeStaffArray(payload.staff);
    if (payload.costs) payload.costs = normalizeCostsArray(payload.costs);
    payload.createdBy = session.user.username || session.user.name || "unknown";

    const action = new Action(payload);
    await action.save();
    // Auto-create contas a pagar entries per colaborador e custos
    try {
      const staff = Array.isArray(action.staff) ? action.staff : [];
      const reportDate = action.dueDate || action.createdAt || new Date();
      const ops = staff.map((s) => ({
        updateOne: {
          filter: { actionId: action._id, staffName: s.name },
          update: { $setOnInsert: { status: 'ABERTO', actionId: action._id, staffName: s.name }, $set: { reportDate } },
          upsert: true,
        }
      }));
      const costs = Array.isArray(action.costs) ? action.costs : [];
      const opsCosts = costs.map((c) => ({
        updateOne: {
          filter: { actionId: action._id, costId: c._id },
          update: { $setOnInsert: { status: 'ABERTO', actionId: action._id, costId: c._id }, $set: { reportDate, colaboradorId: c.colaboradorId || undefined } },
          upsert: true,
        }
      }));
      const allOps = [...ops, ...opsCosts];
      if (allOps.length) await ContasAPagar.bulkWrite(allOps);
    } catch (e) {
      try { process.stderr.write('Failed to create ContasAPagar entries for action ' + String(action._id) + ': ' + String(e) + '\n'); } catch { void 0; /* noop */ }
    }

    return created(toPlainDoc(action.toObject ? action.toObject() : action));
  } catch (err) {
    try { process.stderr.write('Error creating action: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Failed to create action');
  }
}

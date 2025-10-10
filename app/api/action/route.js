/* eslint-env node */
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
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

// helpers moved to lib/helpers/actions.js

export async function GET(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const searchParams = request.nextUrl?.searchParams ?? new globalThis.URL(request.url).searchParams;
    const { query, q } = await buildActionsQuery(searchParams);

    const actions = await Action.find(query).sort({ createdAt: -1 }).lean().exec();

    await enrichActionsWithClientName(actions);

    narrowStaffByQuery(actions, q);

    return NextResponse.json(actions, { status: 200 });
  } catch (error) {
    try { process.stderr.write('Error fetching actions: ' + String(error) + '\n'); } catch { void 0; /* noop */ }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  // Create new action
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    try { validateActionCreate(body); } catch (e) { return NextResponse.json({ error: e.message || 'Invalid payload' }, { status: e.status || 400 }); }
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
    // Auto-create contas a pagar entries per servidor e custos
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
          update: { $setOnInsert: { status: 'ABERTO', actionId: action._id, costId: c._id }, $set: { reportDate, colaboradorId: c.colaboradorId || c.servidorId || undefined } },
          upsert: true,
        }
      }));
      const allOps = [...ops, ...opsCosts];
      if (allOps.length) await ContasAPagar.bulkWrite(allOps);
    } catch (e) {
      try { process.stderr.write('Failed to create ContasAPagar entries for action ' + String(action._id) + ': ' + String(e) + '\n'); } catch { void 0; /* noop */ }
    }

    return NextResponse.json(action, { status: 201 });
  } catch (err) {
    try { process.stderr.write('Error creating action: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return NextResponse.json({ error: "Failed to create action" }, { status: 500 });
  }
}

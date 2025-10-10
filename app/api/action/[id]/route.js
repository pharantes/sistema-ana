/* eslint-env node */
import { getServerSession } from "next-auth/next";
import baseOptions from "../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import Cliente from "../../../../lib/db/models/Cliente.js";
import ContasAPagar from "../../../../lib/db/models/ContasAPagar.js";
import { ok, badRequest, notFound, unauthorized, forbidden, serverError } from "../../../../lib/api/responses";
import { toPlainDoc } from "../../../../lib/utils/mongo";
import { rateLimit } from "../../../../lib/utils/rateLimit";

const idFn = (req) => req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 40, idFn });
const delLimiter = rateLimit({ windowMs: 10_000, limit: 20, idFn });

export async function GET(request, context) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();

    getLimiter.check(request);
    const params = await (context?.params);
    const { id } = params || {};
    if (!id) return badRequest("Missing id");
    await dbConnect();
    const action = await Action.findById(id).lean().exec();
    if (!action) return notFound("Not found");
    try {
      const cid = String(action.client || '');
      if (/^[0-9a-fA-F]{24}$/.test(cid)) {
        const c = await Cliente.findById(cid).select('nome codigo').lean().exec();
        if (c) action.clientName = `${c.codigo ? c.codigo + ' ' : ''}${c.nome || ''}`.trim();
      }
    } catch { void 0; /* noop: ignore client resolve */ }
    return ok(toPlainDoc(action));
  } catch (err) {
    try { process.stderr.write('GET /api/action/[id] error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Internal Server Error');
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();

    delLimiter.check(request);
    if (session.user.role !== "admin") return forbidden();

    const params = await (context?.params);
    const { id } = params || {};
    if (!id) return badRequest("Missing id");

    await dbConnect();
    const deleted = await Action.findByIdAndDelete(id);
    if (!deleted) return notFound("Not found");
    // Cascade delete contas a pagar entries for this action
    try { await ContasAPagar.deleteMany({ actionId: id }); } catch { void 0; /* noop */ }

    // 204 with empty body
    return new Response(null, { status: 204 });
  } catch (err) {
    try { process.stderr.write('DELETE /api/action/[id] error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Internal Server Error');
  }
}

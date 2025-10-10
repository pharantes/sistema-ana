/* eslint-env node */
import dbConnect from '@/lib/db/connect';
import ContaFixa from '@/lib/db/models/ContaFixa';
import { getServerSession } from 'next-auth';
import baseOptions from '@/lib/auth/authOptionsBase';
import { parseDateMaybe } from '@/lib/utils/dates';
import { validateContaFixaCreate, validateContaFixaUpdate } from '@/lib/validators/contafixa';
import { ok, created, badRequest, unauthorized, serverError, notFound } from '@/lib/api/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const contas = await ContaFixa.find({}).sort({ createdAt: -1 }).lean();
    return ok(contas);
  } catch (err) {
    try { process.stderr.write('GET /api/contafixa error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to fetch contas fixas');
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();
    await dbConnect();
    const body = await request.json();
    try { validateContaFixaCreate(body); } catch (e) { return badRequest(e.message || 'Invalid payload'); }
    const payload = {
      name: (body.name || '').trim(),
      empresa: (body.empresa || '').trim(),
      tipo: (body.tipo || '').trim(),
      valor: (body.valor !== undefined && body.valor !== null && body.valor !== '') ? Number(body.valor) || 0 : undefined,
      status: (body.status && String(body.status).toUpperCase() === 'PAGO') ? 'PAGO' : 'ABERTO',
      lastPaidAt: parseDateMaybe(body.lastPaidAt),
      vencimento: parseDateMaybe(body.vencimento),
    };
    if (!payload.name || !payload.empresa || !['quizenal', 'mensal'].includes(payload.tipo)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    if (payload.status === 'PAGO' && !payload.lastPaidAt) {
      payload.lastPaidAt = new Date();
    }
    // Create first to get createdAt
    let doc = await ContaFixa.create(payload);
    // Compute nextDueAt from lastPaidAt or createdAt
    const base = doc.lastPaidAt || doc.createdAt;
    const addDays = doc.tipo === 'quizenal' ? 15 : 30;
    const due = new Date(base);
    due.setDate(due.getDate() + addDays);
    doc.nextDueAt = due;
    await doc.save();
    // Ensure we return a plain object with all fields serialized
    return created(doc.toObject());
  } catch (err) {
    try { process.stderr.write('POST /api/contafixa error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to create conta fixa');
  }
}

export async function PATCH(request) {
  try {
    const parseDate = (val) => (val === null ? null : parseDateMaybe(val));
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();
    await dbConnect();
    const parsed = await request.json();
    try { validateContaFixaUpdate(parsed); } catch (e) { return badRequest(e.message || 'Invalid payload'); }
    const { id, ...rest } = parsed;
    if (!id) return badRequest('Missing id');
    const setUpdate = {
      ...(rest.name != null ? { name: String(rest.name).trim() } : {}),
      ...(rest.empresa != null ? { empresa: String(rest.empresa).trim() } : {}),
      ...(rest.tipo != null ? { tipo: String(rest.tipo).trim() } : {}),
    };
    const unsetUpdate = {};
    if (Object.prototype.hasOwnProperty.call(rest, 'vencimento')) {
      if (rest.vencimento === null) {
        unsetUpdate.vencimento = "";
      } else if (rest.vencimento) {
        setUpdate.vencimento = parseDate(rest.vencimento);
      }
    }
    if (Object.prototype.hasOwnProperty.call(rest, 'valor')) {
      setUpdate.valor = (rest.valor !== undefined && rest.valor !== null && rest.valor !== '') ? Number(rest.valor) || 0 : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(rest, 'status')) {
      const s = String(rest.status || '').toUpperCase();
      if (s === 'PAGO' || s === 'ABERTO') setUpdate.status = s;
    }
    // unsetUpdate declared above
    if (Object.prototype.hasOwnProperty.call(rest, 'lastPaidAt')) {
      if (rest.lastPaidAt === null) {
        unsetUpdate.lastPaidAt = "";
      } else if (rest.lastPaidAt) {
        setUpdate.lastPaidAt = parseDate(rest.lastPaidAt);
      }
    }
    const updateQuery = {
      ...(Object.keys(setUpdate).length ? { $set: setUpdate } : {}),
      ...(Object.keys(unsetUpdate).length ? { $unset: unsetUpdate } : {}),
    };
    let doc = await ContaFixa.findByIdAndUpdate(id, updateQuery, { new: true });
    if (!doc) return notFound('Not found');
    // Recompute nextDueAt when tipo or lastPaidAt changed or when status toggled
    const base = doc.lastPaidAt || doc.createdAt;
    if (base) {
      const addDays = doc.tipo === 'quizenal' ? 15 : 30;
      const due = new Date(base);
      due.setDate(due.getDate() + addDays);
      doc.nextDueAt = due;
      await doc.save();
    }
    // Return a plain object to avoid any serialization quirks
    return ok(doc.toObject());
  } catch (err) {
    try { process.stderr.write('PATCH /api/contafixa error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to update conta fixa');
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();
    await dbConnect();
    const { id } = await request.json();
    if (!id) return badRequest('Missing id');
    await ContaFixa.findByIdAndDelete(id);
    return ok({ success: true });
  } catch (err) {
    try { process.stderr.write('DELETE /api/contafixa error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to delete conta fixa');
  }
}

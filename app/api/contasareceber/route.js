/* eslint-env node */
import { getServerSession } from 'next-auth';
import baseOptions from '@/lib/auth/authOptionsBase';
import connect from '@/lib/db/connect';
import Action from '@/lib/db/models/Action';
import Cliente from '@/lib/db/models/Cliente';
import ContasAReceber from '@/lib/db/models/ContasAReceber';
import { ok, badRequest, forbidden, serverError } from '@/lib/api/responses';
import { toPlainDocs, toPlainDoc } from '@/lib/utils/mongo';
import { rateLimit } from '@/lib/utils/rateLimit';
import { validateContasAReceberUpsert } from '@/lib/validators/contasareceber';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const idFn = (req) => req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 60, idFn });
const patchLimiter = rateLimit({ windowMs: 10_000, limit: 30, idFn });

// GET: Join recent Actions with their receivable entry and client name
export async function GET(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== 'admin') return forbidden();
    getLimiter.check(request);
    await connect();

    const actions = await Action.find({}).sort({ createdAt: -1 }).lean();

    // Fetch existing receivables for these actions
    const actionIds = actions.map(a => a._id);
    const recebiveis = await ContasAReceber.find({ actionId: { $in: actionIds } }).lean();
    const recMap = new Map(recebiveis.map(r => [String(r.actionId), r]));

    // Resolve client names
    const clientIds = Array.from(new Set(actions.map(a => String(a.client || '')).filter(id => /^[0-9a-fA-F]{24}$/.test(id))));
    let clientes = [];
    if (clientIds.length) {
      clientes = await Cliente.find({ _id: { $in: clientIds } }).select('_id nome codigo pix banco conta formaPgt').lean();
    }
    const clientMap = new Map(clientes.map(c => [String(c._id), c]));

    const rows = actions.map(a => {
      const r = recMap.get(String(a._id));
      const cliente = clientMap.get(String(a.client || ''));
      return {
        _id: String(a._id),
        name: a.name || a.event || '',
        clientId: cliente?._id ? String(cliente._id) : String(a.client || ''),
        clientName: cliente ? `${cliente.codigo ? cliente.codigo + ' ' : ''}${cliente.nome}` : String(a.client || ''),
        date: a.date || a.createdAt,
        value: r?.valor ?? a.value ?? 0,
        receivable: r ? toPlainDoc(r) : null,
        clienteDetails: cliente ? { pix: cliente.pix, banco: cliente.banco, conta: cliente.conta, formaPgt: cliente.formaPgt } : null,
      };
    });

    return ok(toPlainDocs(rows));
  } catch (err) {
    try { process.stderr.write('GET /api/contasareceber error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to fetch contas a receber');
  }
}

// PATCH: Upsert a receivable entry for an action
export async function PATCH(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== 'admin') return forbidden();
    patchLimiter.check(request);
    await connect();
    const body = await request.json();
    try { validateContasAReceberUpsert(body); } catch (e) { return badRequest(e.message || 'Invalid payload'); }
    const {
      id,
      actionId,
      clientId,
      reportDate,
      status,
      banco, conta, formaPgt,
      descricao,
      recorrente, parcelas,
      qtdeParcela, valorParcela,
      valor,
      dataVencimento, dataRecebimento,
    } = body;

    const payload = {
      actionId,
      clientId,
      status,
      banco, conta, formaPgt,
      descricao,
      recorrente, parcelas,
      qtdeParcela, valorParcela,
      valor,
    };
    if (reportDate) payload.reportDate = new Date(reportDate);
    if (dataVencimento) payload.dataVencimento = new Date(dataVencimento);
    if (dataRecebimento) payload.dataRecebimento = new Date(dataRecebimento);

    let saved;
    if (id) {
      saved = await ContasAReceber.findByIdAndUpdate(id, payload, { new: true });
    } else {
      // Ensure a default reportDate if missing
      if (!payload.reportDate) payload.reportDate = new Date();
      saved = await ContasAReceber.findOneAndUpdate(
        { actionId },
        { $set: payload, $setOnInsert: { actionId } },
        { new: true, upsert: true }
      );
    }
    return ok(toPlainDoc(saved.toObject ? saved.toObject() : saved));
  } catch (err) {
    try { process.stderr.write('PATCH /api/contasareceber error: ' + String(err) + '\n'); } catch { /* noop */ }
    return serverError('Failed to save conta a receber');
  }
}

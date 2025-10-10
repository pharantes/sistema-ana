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

    const searchParams = request.nextUrl?.searchParams ?? new globalThis.URL(request.url).searchParams;
    const q = (searchParams.get('q') || '').trim();
    const actionId = (searchParams.get('actionId') || '').trim();
    const sort = (searchParams.get('sort') || 'date').trim();
    const dir = (searchParams.get('dir') || 'desc').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const vencFrom = (searchParams.get('vencFrom') || '').trim();
    const vencTo = (searchParams.get('vencTo') || '').trim();
    const recFrom = (searchParams.get('recFrom') || '').trim();
    const recTo = (searchParams.get('recTo') || '').trim();
    const status = (searchParams.get('status') || '').trim().toUpperCase(); // ABERTO | RECEBIDO

    const actionsQuery = {};
    const or = [];
    if (actionId && /^[0-9a-fA-F]{24}$/.test(actionId)) actionsQuery._id = actionId;
    if (q) {
      // eslint-disable-next-line security/detect-non-literal-regexp
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      or.push({ name: re }, { event: re });
      // match by client name: find ids by nome
      const clientIds = await Cliente.find({ nome: re }).select('_id').lean();
      if (clientIds.length) or.push({ client: { $in: clientIds.map(c => c._id) } });
    }
    if (or.length) actionsQuery.$or = or;

    // Build allowed actionId set from receivables date filters if provided
    let allowed = null;
    const rangeFilters = [];
    if (vencFrom || vencTo) {
      const rf = {};
      if (vencFrom) rf.$gte = new Date(vencFrom);
      if (vencTo) rf.$lte = new Date(`${vencTo}T23:59:59.999Z`);
      rangeFilters.push({ dataVencimento: rf });
    }
    if (recFrom || recTo) {
      const rr = {};
      if (recFrom) rr.$gte = new Date(recFrom);
      if (recTo) rr.$lte = new Date(`${recTo}T23:59:59.999Z`);
      rangeFilters.push({ dataRecebimento: rr });
    }
    if (status === 'ABERTO' || status === 'RECEBIDO') {
      rangeFilters.push({ status });
    }
    if (rangeFilters.length) {
      const match = rangeFilters.length === 1 ? rangeFilters[0] : { $and: rangeFilters };
      const recs = await ContasAReceber.find(match).select('actionId').lean();
      allowed = new Set(recs.map(r => String(r.actionId)));
      if (allowed.size === 0) return ok({ items: [], total: 0 }); // no matches
      actionsQuery._id = actionsQuery._id
        ? actionsQuery._id
        : { $in: Array.from(allowed) };
    }

    const actions = await Action.find(actionsQuery).sort({ createdAt: -1 }).lean();

    // Fetch existing receivables for these actions
    const actionIds = actions.map(a => a._id);
    const recMatch = { actionId: { $in: actionIds } };
    if (status === 'ABERTO' || status === 'RECEBIDO') recMatch.status = status;
    const recebiveis = await ContasAReceber.find(recMatch).lean();
    const recMap = new Map(recebiveis.map(r => [String(r.actionId), r]));

    // Resolve client names
    const clientIds = Array.from(new Set(actions.map(a => String(a.client || '')).filter(id => /^[0-9a-fA-F]{24}$/.test(id))));
    let clientes = [];
    if (clientIds.length) {
      clientes = await Cliente.find({ _id: { $in: clientIds } }).select('_id nome codigo pix banco conta formaPgt').lean();
    }
    const clientMap = new Map(clientes.map(c => [String(c._id), c]));

    let rows = actions.map(a => {
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

    const getVal = (a) => {
      switch (sort) {
        case 'acao': return String(a?.name || '').toLowerCase();
        case 'cliente': return String(a?.clientName || '').toLowerCase();
        case 'venc': return a?.receivable?.dataVencimento ? new Date(a.receivable.dataVencimento).getTime() : 0;
        case 'receb': return a?.receivable?.dataRecebimento ? new Date(a.receivable.dataRecebimento).getTime() : 0;
        case 'date':
        default: return a?.date ? new Date(a.date).getTime() : 0;
      }
    };
    rows.sort((a, b) => {
      const va = getVal(a); const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va;
      const sa = String(va || ''); const sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return dir === 'asc' ? cmp : -cmp;
    });

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    return ok({ items: toPlainDocs(items), total });
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

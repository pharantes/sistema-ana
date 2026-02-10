/* eslint-env node */
import { getValidatedAdminSession } from '@/lib/auth/session';
import connect from '@/lib/db/connect';
import Action from '@/lib/db/models/Action';
import Cliente from '@/lib/db/models/Cliente';
import ContasAReceber from '@/lib/db/models/ContasAReceber';
import { ok, badRequest, serverError } from '@/lib/api/responses';
import { toPlainDocs, toPlainDoc } from '@/lib/utils/mongo';
import { rateLimit } from '@/lib/utils/rateLimit';
import { validateContasAReceberUpsert } from '@/lib/validators/contasareceber';
import { logError } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getClientIdentifier = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 60, idFn: getClientIdentifier });
const patchLimiter = rateLimit({ windowMs: 10_000, limit: 30, idFn: getClientIdentifier });

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Extracts search parameters from request
 */
function extractSearchParameters(request) {
  const searchParams = request.nextUrl?.searchParams ?? new globalThis.URL(request.url).searchParams;

  return {
    id: (searchParams.get('id') || '').trim(), // Receivable ID for single fetch
    searchQuery: (searchParams.get('q') || '').trim(),
    actionId: (searchParams.get('actionId') || '').trim(),
    sortField: (searchParams.get('sort') || 'date').trim(),
    sortDirection: (searchParams.get('dir') || 'desc').trim().toLowerCase() === 'asc' ? 'asc' : 'desc',
    pageNumber: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    pageSize: Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10))),
    vencimentoFrom: (searchParams.get('vencFrom') || '').trim(),
    vencimentoTo: (searchParams.get('vencTo') || '').trim(),
    recebimentoFrom: (searchParams.get('recFrom') || '').trim(),
    recebimentoTo: (searchParams.get('recTo') || '').trim(),
    statusFilter: (searchParams.get('status') || '').trim().toUpperCase(),
  };
}

/**
 * Builds payload for upserting receivable entry
 */
function buildReceivablePayload(requestBody) {
  const payload = {
    actionIds: requestBody.actionIds,
    clientId: requestBody.clientId,
    banco: requestBody.banco,
    conta: requestBody.conta,
    formaPgt: requestBody.formaPgt,
    descricao: requestBody.descricao,
    recorrente: requestBody.recorrente,
    qtdeParcela: requestBody.qtdeParcela,
    valorParcela: requestBody.valorParcela,
    valor: requestBody.valor,
  };

  // Handle installments
  if (requestBody.installments && Array.isArray(requestBody.installments) && requestBody.installments.length > 0) {
    payload.installments = requestBody.installments.map(inst => ({
      number: inst.number,
      value: inst.value,
      dueDate: inst.dueDate ? new Date(inst.dueDate) : undefined,
      status: inst.status || 'ABERTO',
      paidDate: inst.paidDate ? new Date(inst.paidDate) : undefined,
    }));

    // Auto-set parcelas to true when installments exist
    payload.parcelas = true;

    // Auto-calculate status: RECEBIDO only if ALL installments are RECEBIDO
    const allPaid = payload.installments.every(inst => inst.status === 'RECEBIDO');
    payload.status = allPaid ? 'RECEBIDO' : 'ABERTO';
  } else {
    // For single payments, use the provided values
    payload.parcelas = requestBody.parcelas || false;
    payload.status = requestBody.status;
    payload.installments = [];
  }

  if (requestBody.reportDate) {
    payload.reportDate = new Date(requestBody.reportDate);
  }
  if (requestBody.dataVencimento) {
    payload.dataVencimento = new Date(requestBody.dataVencimento);
  }
  if (requestBody.dataRecebimento) {
    payload.dataRecebimento = new Date(requestBody.dataRecebimento);
  }

  return payload;
}

/**
 * Creates a new receivable entry
 */
async function createReceivable(payload) {
  // Ensure default reportDate for new entries
  if (!payload.reportDate) {
    payload.reportDate = new Date();
  }

  const receivable = new ContasAReceber(payload);
  return await receivable.save();
}

/**
 * Updates an existing receivable entry by ID
 */
async function updateReceivable(receivableId, payload) {
  return await ContasAReceber.findByIdAndUpdate(receivableId, payload, { new: true });
}

/**
 * Builds query filter for receivables based on search parameters
 */
async function buildReceivablesQuery(params) {
  const { id, searchQuery, statusFilter, vencimentoFrom, vencimentoTo, recebimentoFrom, recebimentoTo } = params;
  const query = {};

  // Direct ID lookup for single receivable fetch
  if (id && isValidObjectId(id)) {
    query._id = id;
    return query; // Skip other filters for direct ID lookup
  }

  // Status filter
  if (statusFilter === 'ABERTO' || statusFilter === 'RECEBIDO') {
    query.status = statusFilter;
  }

  // Date filters
  if (vencimentoFrom || vencimentoTo) {
    query.dataVencimento = {};
    if (vencimentoFrom) query.dataVencimento.$gte = new Date(vencimentoFrom);
    if (vencimentoTo) query.dataVencimento.$lte = new Date(`${vencimentoTo}T23:59:59.999Z`);
  }

  if (recebimentoFrom || recebimentoTo) {
    query.dataRecebimento = {};
    if (recebimentoFrom) query.dataRecebimento.$gte = new Date(recebimentoFrom);
    if (recebimentoTo) query.dataRecebimento.$lte = new Date(`${recebimentoTo}T23:59:59.999Z`);
  }

  // Text search - search in description or related actions/clients
  if (searchQuery) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const searchRegex = new RegExp(escapeRegex(searchQuery), 'i');
    const orConditions = [];

    // Search in description
    orConditions.push({ descricao: searchRegex });

    // Search in client names
    const matchingClients = await Cliente.find({ nome: searchRegex }).select('_id').lean();
    if (matchingClients.length) {
      orConditions.push({ clientId: { $in: matchingClients.map(c => c._id) } });
    }

    // Search in action names
    const matchingActions = await Action.find({
      $or: [
        { name: searchRegex },
        { event: searchRegex }
      ]
    }).select('_id').lean();
    if (matchingActions.length) {
      orConditions.push({ actionIds: { $in: matchingActions.map(a => a._id) } });
    }

    if (orConditions.length) {
      query.$or = orConditions;
    }
  }

  return query;
}

/**
 * Enriches receivables with action and client details
 */
async function enrichReceivablesWithDetails(receivables) {
  // Collect all unique action IDs and client IDs
  const actionIdsSet = new Set();
  const clientIdsSet = new Set();

  for (const receivable of receivables) {
    if (Array.isArray(receivable.actionIds)) {
      receivable.actionIds.forEach(id => actionIdsSet.add(String(id)));
    }
    if (receivable.clientId) {
      clientIdsSet.add(String(receivable.clientId));
    }
  }

  // Fetch actions and clients
  const [actions, clientes] = await Promise.all([
    Action.find({ _id: { $in: Array.from(actionIdsSet) } })
      .select('_id name event client')
      .lean(),
    Cliente.find({ _id: { $in: Array.from(clientIdsSet) } })
      .select('_id nome codigo pix banco conta formaPgt')
      .lean()
  ]);

  // Create maps for quick lookup
  const actionsMap = new Map(actions.map(a => [String(a._id), a]));
  const clientesMap = new Map(clientes.map(c => [String(c._id), c]));

  // Enrich each receivable
  for (const receivable of receivables) {
    // Attach action details
    receivable.actions = (receivable.actionIds || [])
      .map(id => actionsMap.get(String(id)))
      .filter(Boolean);

    // Attach client details
    if (receivable.clientId) {
      const cliente = clientesMap.get(String(receivable.clientId));
      if (cliente) {
        receivable.clientName = cliente.codigo
          ? `${cliente.codigo} ${cliente.nome}`.trim()
          : cliente.nome;
        receivable.clienteDetails = {
          pix: cliente.pix,
          banco: cliente.banco,
          conta: cliente.conta,
          formaPgt: cliente.formaPgt
        };
      }
    }
  }

  return receivables;
}

/**
 * GET /api/contasareceber - Retrieve contas a receber with filtering, sorting, and pagination
 */
export async function GET(request) {
  try {
    const { error: sessionError } = await getValidatedAdminSession();
    if (sessionError) return sessionError;

    getLimiter.check(request);
    await connect();

    const searchParameters = extractSearchParameters(request);

    // Build query for receivables (not actions!)
    const query = await buildReceivablesQuery(searchParameters);

    // Fetch receivables
    let receivables = await ContasAReceber.find(query)
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    // Enrich with action and client details
    await enrichReceivablesWithDetails(receivables);

    // Sort receivables
    receivables = sortReceivables(receivables, searchParameters.sortField, searchParameters.sortDirection);

    // Pagination
    const totalRows = receivables.length;
    const startIndex = (searchParameters.pageNumber - 1) * searchParameters.pageSize;
    const paginatedItems = receivables.slice(startIndex, startIndex + searchParameters.pageSize);

    return ok({ items: toPlainDocs(paginatedItems), total: totalRows });
  } catch (error) {
    logError('GET /api/contasareceber error', error);
    return serverError('Failed to fetch contas a receber');
  }
}

/**
 * Sorts receivables based on field and direction
 */
function sortReceivables(receivables, sortField, sortDirection) {
  const sorted = [...receivables];

  sorted.sort((a, b) => {
    let valueA, valueB;

    switch (sortField) {
      case 'cliente':
        valueA = (a.clientName || '').toLowerCase();
        valueB = (b.clientName || '').toLowerCase();
        break;
      case 'descricao':
        valueA = (a.descricao || '').toLowerCase();
        valueB = (b.descricao || '').toLowerCase();
        break;
      case 'qtdeParcela':
        valueA = Number(a.qtdeParcela || 1);
        valueB = Number(b.qtdeParcela || 1);
        break;
      case 'valorParcela':
        valueA = Number(a.valorParcela || a.valor || 0);
        valueB = Number(b.valorParcela || b.valor || 0);
        break;
      case 'valor':
        valueA = Number(a.valor || 0);
        valueB = Number(b.valor || 0);
        break;
      case 'status':
        valueA = (a.status || 'ABERTO').toLowerCase();
        valueB = (b.status || 'ABERTO').toLowerCase();
        break;
      case 'venc':
        valueA = a.dataVencimento ? new Date(a.dataVencimento).getTime() : 0;
        valueB = b.dataVencimento ? new Date(b.dataVencimento).getTime() : 0;
        break;
      case 'receb':
        valueA = a.dataRecebimento ? new Date(a.dataRecebimento).getTime() : 0;
        valueB = b.dataRecebimento ? new Date(b.dataRecebimento).getTime() : 0;
        break;
      case 'date':
      default:
        valueA = a.reportDate ? new Date(a.reportDate).getTime() : 0;
        valueB = b.reportDate ? new Date(b.reportDate).getTime() : 0;
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const comparison = String(valueA || '').localeCompare(String(valueB || ''));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * POST /api/contasareceber - Create a new receivable entry
 */
export async function POST(request) {
  try {
    const { error: sessionError } = await getValidatedAdminSession();
    if (sessionError) return sessionError;

    patchLimiter.check(request);
    await connect();

    const requestBody = await request.json();

    try {
      validateContasAReceberUpsert(requestBody);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    const payload = buildReceivablePayload(requestBody);
    const savedReceivable = await createReceivable(payload);

    const plainDocument = savedReceivable.toObject
      ? savedReceivable.toObject()
      : savedReceivable;

    return ok(toPlainDoc(plainDocument));
  } catch (error) {
    logError('POST /api/contasareceber error', error);
    return serverError('Failed to create conta a receber');
  }
}

/**
 * PATCH /api/contasareceber - Update an existing receivable entry
 */
export async function PATCH(request) {
  try {
    const { error: sessionError } = await getValidatedAdminSession();
    if (sessionError) return sessionError;

    patchLimiter.check(request);
    await connect();

    const requestBody = await request.json();

    try {
      validateContasAReceberUpsert(requestBody);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    const { id } = requestBody;

    if (!id) {
      return badRequest('ID is required for updating');
    }

    const payload = buildReceivablePayload(requestBody);
    const savedReceivable = await updateReceivable(id, payload);

    if (!savedReceivable) {
      return badRequest('Receivable not found');
    }

    const plainDocument = savedReceivable.toObject
      ? savedReceivable.toObject()
      : savedReceivable;

    return ok(toPlainDoc(plainDocument));
  } catch (error) {
    logError('PATCH /api/contasareceber error', error);
    return serverError('Failed to update conta a receber');
  }
}

/**
 * DELETE /api/contasareceber - Delete a receivable entry
 */
export async function DELETE(request) {
  try {
    const { error: sessionError } = await getValidatedAdminSession();
    if (sessionError) return sessionError;

    await connect();

    const { id } = await request.json();

    if (!id) {
      return badRequest('ID is required for deletion');
    }

    const deletedReceivable = await ContasAReceber.findByIdAndDelete(id);

    if (!deletedReceivable) {
      return badRequest('Receivable not found');
    }

    return ok({ message: 'Conta a receber deleted successfully', id });
  } catch (error) {
    logError('DELETE /api/contasareceber error', error);
    return serverError('Failed to delete conta a receber');
  }
}

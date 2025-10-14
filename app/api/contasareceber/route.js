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

const getClientIdentifier = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 60, idFn: getClientIdentifier });
const patchLimiter = rateLimit({ windowMs: 10_000, limit: 30, idFn: getClientIdentifier });

/**
 * Logs error messages to stderr
 */
function logError(message, error) {
  try {
    process.stderr.write(`${message}: ${String(error)}\n`);
  } catch {
    /* Ignore logging errors */
  }
}

/**
 * Validates admin session
 */
async function getValidatedAdminSession() {
  const session = await getServerSession(baseOptions);
  if (!session || !session.user || session.user.role !== 'admin') {
    return { session: null, error: forbidden() };
  }
  return { session, error: null };
}

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
 * Builds the actions query with text search and client filters
 */
async function buildActionsQuery(params) {
  const { searchQuery, actionId } = params;
  const query = {};
  const orConditions = [];

  if (actionId && isValidObjectId(actionId)) {
    query._id = actionId;
  }

  if (searchQuery) {
    const searchRegex = new RegExp(escapeRegex(searchQuery), 'i');
    orConditions.push({ name: searchRegex }, { event: searchRegex });

    // Match by client name
    const matchingClients = await Cliente.find({ nome: searchRegex }).select('_id').lean();
    if (matchingClients.length) {
      orConditions.push({ client: { $in: matchingClients.map(c => c._id) } });
    }
  }

  if (orConditions.length) {
    query.$or = orConditions;
  }

  return query;
}

/**
 * Builds date range filters for receivables
 */
function buildReceivablesDateFilters(params) {
  const { vencimentoFrom, vencimentoTo, recebimentoFrom, recebimentoTo, statusFilter } = params;
  const filters = [];

  if (vencimentoFrom || vencimentoTo) {
    const vencimentoRange = {};
    if (vencimentoFrom) vencimentoRange.$gte = new Date(vencimentoFrom);
    if (vencimentoTo) vencimentoRange.$lte = new Date(`${vencimentoTo}T23:59:59.999Z`);
    filters.push({ dataVencimento: vencimentoRange });
  }

  if (recebimentoFrom || recebimentoTo) {
    const recebimentoRange = {};
    if (recebimentoFrom) recebimentoRange.$gte = new Date(recebimentoFrom);
    if (recebimentoTo) recebimentoRange.$lte = new Date(`${recebimentoTo}T23:59:59.999Z`);
    filters.push({ dataRecebimento: recebimentoRange });
  }

  if (statusFilter === 'ABERTO' || statusFilter === 'RECEBIDO') {
    filters.push({ status: statusFilter });
  }

  return filters;
}

/**
 * Filters actions by allowed receivables if date filters are present
 */
async function filterActionsByReceivables(actionsQuery, dateFilters) {
  if (dateFilters.length === 0) {
    return actionsQuery;
  }

  const matchQuery = dateFilters.length === 1 ? dateFilters[0] : { $and: dateFilters };
  const matchingReceivables = await ContasAReceber.find(matchQuery).select('actionId').lean();
  const allowedActionIds = new Set(matchingReceivables.map(r => String(r.actionId)));

  if (allowedActionIds.size === 0) {
    return null; // No matches
  }

  actionsQuery._id = actionsQuery._id || { $in: Array.from(allowedActionIds) };
  return actionsQuery;
}

/**
 * Fetches cliente map for given client IDs
 */
async function fetchClientesMap(actions) {
  const clientIds = Array.from(
    new Set(
      actions
        .map(a => String(a.client || ''))
        .filter(id => isValidObjectId(id))
    )
  );

  if (clientIds.length === 0) {
    return new Map();
  }

  const clientes = await Cliente.find({ _id: { $in: clientIds } })
    .select('_id nome codigo pix banco conta formaPgt')
    .lean();

  return new Map(clientes.map(c => [String(c._id), c]));
}

/**
 * Formats client display name with codigo prefix if available
 */
function formatClientName(cliente, clientId) {
  if (cliente) {
    const codigoPrefix = cliente.codigo ? `${cliente.codigo} ` : '';
    return `${codigoPrefix}${cliente.nome}`;
  }
  return String(clientId || '');
}

/**
 * Builds row data for actions with receivables and client info
 */
function buildRowsData(actions, receivablesMap, clientesMap) {
  return actions.map(action => {
    const receivable = receivablesMap.get(String(action._id));
    const cliente = clientesMap.get(String(action.client || ''));

    return {
      _id: String(action._id),
      name: action.name || action.event || '',
      clientId: cliente?._id ? String(cliente._id) : String(action.client || ''),
      clientName: formatClientName(cliente, action.client),
      date: action.date || action.createdAt,
      value: receivable?.valor ?? action.value ?? 0,
      receivable: receivable ? toPlainDoc(receivable) : null,
      clienteDetails: cliente ? {
        pix: cliente.pix,
        banco: cliente.banco,
        conta: cliente.conta,
        formaPgt: cliente.formaPgt
      } : null,
    };
  });
}

/**
 * Gets sort value for a row based on sort field
 */
function getSortValue(row, sortField) {
  switch (sortField) {
    case 'acao':
      return String(row?.name || '').toLowerCase();
    case 'cliente':
      return String(row?.clientName || '').toLowerCase();
    case 'venc':
      return row?.receivable?.dataVencimento
        ? new Date(row.receivable.dataVencimento).getTime()
        : 0;
    case 'receb':
      return row?.receivable?.dataRecebimento
        ? new Date(row.receivable.dataRecebimento).getTime()
        : 0;
    case 'date':
    default:
      return row?.date ? new Date(row.date).getTime() : 0;
  }
}

/**
 * Sorts rows based on sort field and direction
 */
function sortRows(rows, sortField, sortDirection) {
  rows.sort((rowA, rowB) => {
    const valueA = getSortValue(rowA, sortField);
    const valueB = getSortValue(rowB, sortField);

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const stringA = String(valueA || '');
    const stringB = String(valueB || '');
    const comparison = stringA.localeCompare(stringB);

    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Paginates rows based on page number and size
 */
function paginateRows(rows, pageNumber, pageSize) {
  const startIndex = (pageNumber - 1) * pageSize;
  return rows.slice(startIndex, startIndex + pageSize);
}

/**
 * Builds payload for upserting receivable entry
 */
function buildReceivablePayload(requestBody) {
  const payload = {
    actionId: requestBody.actionId,
    clientId: requestBody.clientId,
    status: requestBody.status,
    banco: requestBody.banco,
    conta: requestBody.conta,
    formaPgt: requestBody.formaPgt,
    descricao: requestBody.descricao,
    recorrente: requestBody.recorrente,
    parcelas: requestBody.parcelas,
    qtdeParcela: requestBody.qtdeParcela,
    valorParcela: requestBody.valorParcela,
    valor: requestBody.valor,
  };

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
 * Upserts a receivable entry by ID or actionId
 */
async function upsertReceivable(receivableId, actionId, payload) {
  if (receivableId) {
    return await ContasAReceber.findByIdAndUpdate(receivableId, payload, { new: true });
  }

  // Ensure default reportDate for new entries
  if (!payload.reportDate) {
    payload.reportDate = new Date();
  }

  return await ContasAReceber.findOneAndUpdate(
    { actionId },
    { $set: payload, $setOnInsert: { actionId } },
    { new: true, upsert: true }
  );
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

    let actionsQuery = await buildActionsQuery(searchParameters);
    const dateFilters = buildReceivablesDateFilters(searchParameters);

    actionsQuery = await filterActionsByReceivables(actionsQuery, dateFilters);
    if (actionsQuery === null) {
      return ok({ items: [], total: 0 }); // No matches
    }

    const actions = await Action.find(actionsQuery).sort({ createdAt: -1 }).lean();

    // Fetch receivables for these actions
    const actionIds = actions.map(action => action._id);
    const receivablesQuery = { actionId: { $in: actionIds } };
    if (searchParameters.statusFilter === 'ABERTO' || searchParameters.statusFilter === 'RECEBIDO') {
      receivablesQuery.status = searchParameters.statusFilter;
    }
    const receivables = await ContasAReceber.find(receivablesQuery).lean();
    const receivablesMap = new Map(receivables.map(r => [String(r.actionId), r]));

    const clientesMap = await fetchClientesMap(actions);
    let rows = buildRowsData(actions, receivablesMap, clientesMap);

    sortRows(rows, searchParameters.sortField, searchParameters.sortDirection);

    const totalRows = rows.length;
    const paginatedItems = paginateRows(rows, searchParameters.pageNumber, searchParameters.pageSize);

    return ok({ items: toPlainDocs(paginatedItems), total: totalRows });
  } catch (error) {
    logError('GET /api/contasareceber error', error);
    return serverError('Failed to fetch contas a receber');
  }
}

/**
 * PATCH /api/contasareceber - Upsert a receivable entry for an action
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

    const { id, actionId } = requestBody;
    const payload = buildReceivablePayload(requestBody);

    const savedReceivable = await upsertReceivable(id, actionId, payload);

    const plainDocument = savedReceivable.toObject
      ? savedReceivable.toObject()
      : savedReceivable;

    return ok(toPlainDoc(plainDocument));
  } catch (error) {
    logError('PATCH /api/contasareceber error', error);
    return serverError('Failed to save conta a receber');
  }
}

/* eslint-env node */
import { getServerSession } from 'next-auth';
import baseOptions from '@/lib/auth/authOptionsBase';
import connect from '@/lib/db/connect';
import Action from '@/lib/db/models/Action';
import Cliente from '@/lib/db/models/Cliente';
import Colaborador from '@/lib/db/models/Colaborador';
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
    // eslint-disable-next-line security/detect-non-literal-regexp -- input is escaped via escapeRegex
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
 * Enriches staff entries with colaborador data (PIX, banco, conta) by matching names
 */
async function enrichStaffWithColaboradorData(actions) {
  try {
    // Collect all unique staff names from all actions
    const staffNames = new Set();
    for (const action of actions) {
      if (Array.isArray(action.staff)) {
        for (const staffMember of action.staff) {
          if (staffMember.name) {
            staffNames.add(String(staffMember.name).trim());
          }
        }
      }
    }

    if (staffNames.size === 0) {
      return;
    }

    // Fetch colaboradores by name
    const colaboradores = await Colaborador.find({
      nome: { $in: Array.from(staffNames) }
    })
      .select('_id nome pix banco conta')
      .lean();

    // Create a map of name -> colaborador data
    const colaboradorMap = new Map(
      colaboradores.map(c => [String(c.nome).trim(), c])
    );

    // Enrich each staff member with colaboradorData
    for (const action of actions) {
      if (Array.isArray(action.staff)) {
        for (const staffMember of action.staff) {
          const staffName = String(staffMember.name || '').trim();
          const colaborador = colaboradorMap.get(staffName);
          if (colaborador) {
            // Fallback: use colaborador data if staff data is missing
            if (!staffMember.pix && colaborador.pix) {
              staffMember.pix = colaborador.pix;
            }
            if (!staffMember.bank && colaborador.banco) {
              staffMember.bank = colaborador.banco;
            }
            // Attach full colaborador data for reference
            staffMember.colaboradorData = {
              _id: colaborador._id,
              nome: colaborador.nome,
              pix: colaborador.pix,
              banco: colaborador.banco,
              conta: colaborador.conta
            };
          }
        }
      }
    }
  } catch (error) {
    logError('Error enriching staff with colaborador data', error);
    // Continue without enrichment on error
  }
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
      staff: Array.isArray(action.staff) ? action.staff : [],
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
    case 'descricao':
      return String(row?.description || '').toLowerCase();
    case 'qtdeParcela':
      return Number(row?.receivable?.qtdeParcela || 1);
    case 'valorParcela':
      return Number(row?.receivable?.valorParcela || row?.receivable?.valor || 0);
    case 'valor':
      return Number(row?.receivable?.valor || 0);
    case 'status':
      return String(row?.receivable?.status || 'ABERTO').toLowerCase();
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
    actionIds: requestBody.actionIds,
    clientId: requestBody.clientId,
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

  // Handle installments
  if (requestBody.installments && Array.isArray(requestBody.installments) && requestBody.installments.length > 0) {
    payload.installments = requestBody.installments.map(inst => ({
      number: inst.number,
      value: inst.value,
      dueDate: inst.dueDate ? new Date(inst.dueDate) : undefined,
      status: inst.status || 'ABERTO',
      paidDate: inst.paidDate ? new Date(inst.paidDate) : undefined,
    }));

    // Auto-calculate status: RECEBIDO only if ALL installments are RECEBIDO
    const allPaid = payload.installments.every(inst => inst.status === 'RECEBIDO');
    payload.status = allPaid ? 'RECEBIDO' : 'ABERTO';
  } else {
    // For single payments, use the provided status
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

    const actions = await Action.find(actionsQuery).select('_id name event client date startDate endDate createdAt staff').sort({ createdAt: -1 }).lean();

    // Enrich staff with colaborador data (PIX, banco, conta)
    await enrichStaffWithColaboradorData(actions);

    // Fetch receivables for these actions
    const actionIds = actions.map(action => action._id);
    const receivablesQuery = { actionIds: { $in: actionIds } };
    if (searchParameters.statusFilter === 'ABERTO' || searchParameters.statusFilter === 'RECEBIDO') {
      receivablesQuery.status = searchParameters.statusFilter;
    }
    const receivables = await ContasAReceber.find(receivablesQuery).lean();
    // Map receivables by actionId - a receivable can have multiple actionIds, so we need to map each
    const receivablesMap = new Map();
    for (const receivable of receivables) {
      for (const actionId of receivable.actionIds) {
        receivablesMap.set(String(actionId), receivable);
      }
    }

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

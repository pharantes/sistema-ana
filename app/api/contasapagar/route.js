/* eslint-env node */
import ContasAPagar from '@/lib/db/models/ContasAPagar';
import Action from '@/lib/db/models/Action';
import connect from '@/lib/db/connect';
import { getValidatedAdminSession } from '@/lib/auth/session';
import { attachClientNameFromActions, attachColaboradorLabel, linkStaffNameToColaborador } from '@/lib/helpers/contasapagar';
import { validateContasAPagarCreate, validateContasAPagarUpdate } from '@/lib/validators/contasapagar';
import { ok, created, badRequest, notFound, serverError } from '@/lib/api/responses';
import { logError } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Extracts date range filter from search params
 */
function extractDateRangeFilter(searchParams) {
  const vencimentoFrom = searchParams.get('vencFrom');
  const vencimentoTo = searchParams.get('vencTo');

  if (!vencimentoFrom && !vencimentoTo) {
    return {};
  }

  const reportDateFilter = {};
  if (vencimentoFrom) {
    reportDateFilter.$gte = new Date(vencimentoFrom);
  }
  if (vencimentoTo) {
    reportDateFilter.$lte = new Date(vencimentoTo);
  }

  return { reportDate: reportDateFilter };
}

/**
 * Fetches contas with optional populate, falling back to plain docs if populate fails
 */
async function fetchContasWithPopulate(filter) {
  try {
    return await ContasAPagar.find(filter)
      .populate({ path: 'actionId', model: Action })
      .lean();
  } catch (populateError) {
    logError('Populate actionId failed, returning plain docs', populateError);
    return await ContasAPagar.find(filter).lean();
  }
}

/**
 * Enriches contas with related data (status defaults, colaborador, client names)
 */
async function enrichContasWithRelatedData(contas) {
  const contasWithDefaults = contas.map((conta) => ({
    ...conta,
    status: conta.status || 'ABERTO'
  }));

  await attachColaboradorLabel(contasWithDefaults);
  await linkStaffNameToColaborador(contasWithDefaults);
  await attachClientNameFromActions(contasWithDefaults);

  return contasWithDefaults;
}

/**
 * GET /api/contasapagar - Retrieve contas a pagar with optional date filtering
 */
export async function GET(request) {
  try {
    await connect();

    const { searchParams } = new globalThis.URL(request.url);
    const dateFilter = extractDateRangeFilter(searchParams);

    const contas = await fetchContasWithPopulate(dateFilter);
    const enrichedContas = await enrichContasWithRelatedData(contas);

    return ok(enrichedContas);
  } catch (error) {
    logError('GET /api/contasapagar error', error);
    return serverError('Failed to fetch contas a pagar');
  }
}

/**
 * POST /api/contasapagar - Create a new conta a pagar
 */
export async function POST(request) {
  try {
    await connect();

    const requestData = await request.json();

    try {
      validateContasAPagarCreate(requestData);
    } catch (validationError) {
      return badRequest(validationError.message);
    }

    const conta = await ContasAPagar.create({ status: 'ABERTO', ...requestData });

    return created(conta);
  } catch (error) {
    logError('POST /api/contasapagar error', error);
    return serverError('Failed to create conta');
  }
}

/**
 * DELETE /api/contasapagar - Delete a conta a pagar by ID
 */
export async function DELETE(request) {
  try {
    await connect();

    const { id } = await request.json();
    await ContasAPagar.findByIdAndDelete(id);

    return ok({ success: true });
  } catch (error) {
    logError('DELETE /api/contasapagar error', error);
    return serverError('Failed to delete conta');
  }
}

/**
 * PATCH /api/contasapagar - Update conta a pagar status (admin only)
 */
export async function PATCH(request) {
  try {
    const { error: sessionError } = await getValidatedAdminSession();
    if (sessionError) return sessionError;

    await connect();

    const requestData = await request.json();

    try {
      validateContasAPagarUpdate(requestData);
    } catch (validationError) {
      return badRequest(validationError.message);
    }

    const { id, status } = requestData;
    const updatedConta = await ContasAPagar.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedConta) {
      return notFound('Not found');
    }

    return ok(updatedConta);
  } catch (error) {
    logError('PATCH /api/contasapagar error', error);
    return serverError('Failed to update status');
  }
}
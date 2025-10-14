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
 * Validates user session and returns error if invalid
 */
async function getValidatedSession() {
  const session = await getServerSession(baseOptions);
  if (!session || !session.user) {
    return { session: null, error: unauthorized() };
  }
  return { session, error: null };
}

/**
 * Parses date value, converting null to null explicitly
 */
function parseDateValue(dateValue) {
  return dateValue === null ? null : parseDateMaybe(dateValue);
}

/**
 * Calculates the next due date based on tipo (quizenal or mensal)
 */
function calculateNextDueDate(baseDate, tipo) {
  const daysToAdd = tipo === 'quizenal' ? 15 : 30;
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd);
  return dueDate;
}

/**
 * Normalizes status value to uppercase PAGO or ABERTO
 */
function normalizeStatus(statusValue) {
  return String(statusValue).toUpperCase() === 'PAGO' ? 'PAGO' : 'ABERTO';
}

/**
 * Builds the payload for creating a new conta fixa
 */
function buildCreatePayload(requestBody) {
  const payload = {
    name: (requestBody.name || '').trim(),
    empresa: (requestBody.empresa || '').trim(),
    tipo: (requestBody.tipo || '').trim(),
    valor: (requestBody.valor !== undefined && requestBody.valor !== null && requestBody.valor !== '')
      ? Number(requestBody.valor) || 0
      : undefined,
    status: normalizeStatus(requestBody.status || 'ABERTO'),
    lastPaidAt: parseDateMaybe(requestBody.lastPaidAt),
    vencimento: parseDateMaybe(requestBody.vencimento),
  };

  // If status is PAGO and no lastPaidAt, set it to now
  if (payload.status === 'PAGO' && !payload.lastPaidAt) {
    payload.lastPaidAt = new Date();
  }

  return payload;
}

/**
 * Validates required fields for conta fixa creation
 */
function isValidCreatePayload(payload) {
  return payload.name &&
    payload.empresa &&
    ['quizenal', 'mensal'].includes(payload.tipo);
}

/**
 * Updates the nextDueAt field for a conta fixa document
 */
async function updateNextDueDate(document) {
  const baseDate = document.lastPaidAt || document.createdAt;
  if (baseDate) {
    document.nextDueAt = calculateNextDueDate(baseDate, document.tipo);
    await document.save();
  }
}

/**
 * Builds the $set update object for PATCH operation
 */
function buildSetUpdate(updateData) {
  const setUpdate = {};

  if (updateData.name != null) {
    setUpdate.name = String(updateData.name).trim();
  }
  if (updateData.empresa != null) {
    setUpdate.empresa = String(updateData.empresa).trim();
  }
  if (updateData.tipo != null) {
    setUpdate.tipo = String(updateData.tipo).trim();
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'valor')) {
    setUpdate.valor = (updateData.valor !== undefined && updateData.valor !== null && updateData.valor !== '')
      ? Number(updateData.valor) || 0
      : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
    const statusValue = String(updateData.status || '').toUpperCase();
    if (statusValue === 'PAGO' || statusValue === 'ABERTO') {
      setUpdate.status = statusValue;
    }
  }

  return setUpdate;
}

/**
 * Builds the $unset update object for PATCH operation
 */
function buildUnsetUpdate(updateData) {
  const unsetUpdate = {};

  if (Object.prototype.hasOwnProperty.call(updateData, 'vencimento') && updateData.vencimento === null) {
    unsetUpdate.vencimento = "";
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'lastPaidAt') && updateData.lastPaidAt === null) {
    unsetUpdate.lastPaidAt = "";
  }

  return unsetUpdate;
}

/**
 * Adds date fields to setUpdate if they are being updated
 */
function addDateFieldsToSetUpdate(setUpdate, updateData) {
  if (Object.prototype.hasOwnProperty.call(updateData, 'vencimento') &&
    updateData.vencimento !== null &&
    updateData.vencimento) {
    setUpdate.vencimento = parseDateValue(updateData.vencimento);
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'lastPaidAt') &&
    updateData.lastPaidAt !== null &&
    updateData.lastPaidAt) {
    setUpdate.lastPaidAt = parseDateValue(updateData.lastPaidAt);
  }
}

/**
 * GET /api/contafixa - Retrieve all contas fixas
 */
export async function GET() {
  try {
    await dbConnect();
    const contas = await ContaFixa.find({}).sort({ createdAt: -1 }).lean();
    return ok(contas);
  } catch (error) {
    logError('GET /api/contafixa error', error);
    return serverError('Failed to fetch contas fixas');
  }
}

/**
 * POST /api/contafixa - Create a new conta fixa
 */
export async function POST(request) {
  try {
    const { error: sessionError } = await getValidatedSession();
    if (sessionError) return sessionError;

    await dbConnect();

    const requestBody = await request.json();

    try {
      validateContaFixaCreate(requestBody);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    const payload = buildCreatePayload(requestBody);

    if (!isValidCreatePayload(payload)) {
      return badRequest('Invalid payload');
    }

    // Create document first to get createdAt
    const document = await ContaFixa.create(payload);

    // Update nextDueAt based on lastPaidAt or createdAt
    await updateNextDueDate(document);

    return created(document.toObject());
  } catch (error) {
    logError('POST /api/contafixa error', error);
    return serverError('Failed to create conta fixa');
  }
}

/**
 * PATCH /api/contafixa - Update an existing conta fixa
 */
export async function PATCH(request) {
  try {
    const { error: sessionError } = await getValidatedSession();
    if (sessionError) return sessionError;

    await dbConnect();

    const requestBody = await request.json();

    try {
      validateContaFixaUpdate(requestBody);
    } catch (validationError) {
      return badRequest(validationError.message || 'Invalid payload');
    }

    const { id, ...updateData } = requestBody;
    if (!id) return badRequest('Missing id');

    const setUpdate = buildSetUpdate(updateData);
    const unsetUpdate = buildUnsetUpdate(updateData);
    addDateFieldsToSetUpdate(setUpdate, updateData);

    const updateQuery = {
      ...(Object.keys(setUpdate).length ? { $set: setUpdate } : {}),
      ...(Object.keys(unsetUpdate).length ? { $unset: unsetUpdate } : {}),
    };

    const document = await ContaFixa.findByIdAndUpdate(id, updateQuery, { new: true });
    if (!document) return notFound('Not found');

    // Recompute nextDueAt when tipo or lastPaidAt changed
    await updateNextDueDate(document);

    return ok(document.toObject());
  } catch (error) {
    logError('PATCH /api/contafixa error', error);
    return serverError('Failed to update conta fixa');
  }
}

/**
 * DELETE /api/contafixa - Delete a conta fixa by ID
 */
export async function DELETE(request) {
  try {
    const { error: sessionError } = await getValidatedSession();
    if (sessionError) return sessionError;

    await dbConnect();

    const { id } = await request.json();
    if (!id) return badRequest('Missing id');

    await ContaFixa.findByIdAndDelete(id);

    return ok({ success: true });
  } catch (error) {
    logError('DELETE /api/contafixa error', error);
    return serverError('Failed to delete conta fixa');
  }
}

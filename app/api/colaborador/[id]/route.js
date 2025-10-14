/* eslint-env node */
import Colaborador from '@/lib/db/models/Colaborador';
import connect from '@/lib/db/connect';
import mongoose from 'mongoose';
import { ok, badRequest, notFound } from '@/lib/api/responses';

/**
 * Validates if the provided ID is a valid MongoDB ObjectId
 */
function isValidMongoId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Extracts and validates the colaborador ID from context params
 */
async function getColaboradorId(context) {
  const params = await context?.params;
  const { id } = params || {};

  if (!isValidMongoId(id)) {
    return { id: null, error: badRequest('Invalid id') };
  }

  return { id, error: null };
}

/**
 * GET /api/colaborador/[id] - Retrieve a single colaborador by ID
 */
export async function GET(request, context) {
  await connect();

  const { id, error: idError } = await getColaboradorId(context);
  if (idError) return idError;

  const colaborador = await Colaborador.findById(id).lean();
  if (!colaborador) return notFound('Not found');

  return ok(colaborador);
}

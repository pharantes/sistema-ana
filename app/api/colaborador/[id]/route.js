/* eslint-env node */
import Colaborador from '@/lib/db/models/Colaborador';
import connect from '@/lib/db/connect';
import mongoose from 'mongoose';
import { ok, badRequest, notFound } from '@/lib/api/responses';

export async function GET(request, context) {
  await connect();
  const params = await (context?.params);
  const { id } = params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return badRequest('Invalid id');
  }
  const colaborador = await Colaborador.findById(id).lean();
  if (!colaborador) return notFound('Not found');
  return ok(colaborador);
}

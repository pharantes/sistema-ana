/* eslint-env node */
import Cliente from '@/lib/db/models/Cliente';
import connect from '@/lib/db/connect';
import mongoose from 'mongoose';
import { ok, badRequest, notFound } from '@/lib/api/responses';

export async function GET(request, context) {
  await connect();
  // In Next.js 15, params may be async and should be awaited
  const params = await (context?.params);
  const { id } = params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return badRequest('Invalid id');
  }
  const cliente = await Cliente.findById(id).lean();
  if (!cliente) return notFound('Not found');
  return ok(cliente);
}

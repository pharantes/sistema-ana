/* eslint-env node */
import Colaborador from '@/lib/db/models/Colaborador';
import connect from '@/lib/db/connect';
import mongoose from 'mongoose';

export async function GET(request, context) {
  await connect();
  const params = await (context?.params);
  const { id } = params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }
  const colaborador = await Colaborador.findById(id).lean();
  if (!colaborador) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return Response.json(colaborador);
}

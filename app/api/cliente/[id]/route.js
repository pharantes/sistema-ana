/* eslint-env node */
import Cliente from '@/lib/db/models/Cliente';
import connect from '@/lib/db/connect';
import mongoose from 'mongoose';

export async function GET(request, context) {
  await connect();
  // In Next.js 15, params may be async and should be awaited
  const params = await (context?.params);
  const { id } = params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }
  const cliente = await Cliente.findById(id).lean();
  if (!cliente) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return Response.json(cliente);
}

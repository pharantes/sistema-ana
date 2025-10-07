import ContasAPagar from '@/lib/db/models/ContasAPagar';
import connect from '@/lib/db/connect';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  await connect();
  const contas = await ContasAPagar.find().populate('actionId').lean();
  const withDefaults = contas.map((c) => ({
    ...c,
    status: c.status || 'ABERTO',
  }));
  return Response.json(withDefaults);
}

export async function POST(request) {
  await connect();
  const data = await request.json();
  const conta = await ContasAPagar.create({ status: 'ABERTO', ...data });
  return Response.json(conta);
}

export async function DELETE(request) {
  await connect();
  const { id } = await request.json();
  await ContasAPagar.findByIdAndDelete(id);
  return Response.json({ success: true });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  await connect();
  const { id, status } = await request.json();
  if (!id || !['ABERTO', 'PAGO'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const updated = await ContasAPagar.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return Response.json(updated);
}
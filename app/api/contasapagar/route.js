import ContasAPagar from '@/lib/db/models/ContasAPagar';
import connect from '@/lib/db/connect';
import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connect();
    // Try populate; if it fails (bad refs), fall back to plain docs
    let contas;
    try {
      contas = await ContasAPagar.find().populate('actionId').lean();
    } catch (populateErr) {
      console.error('Populate actionId failed, returning plain docs', populateErr);
      contas = await ContasAPagar.find().lean();
    }
    const withDefaults = contas.map((c) => ({
      ...c,
      status: c.status || 'ABERTO',
    }));
    return Response.json(withDefaults);
  } catch (err) {
    console.error('GET /api/contasapagar error', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch contas a pagar' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();
    const conta = await ContasAPagar.create({ status: 'ABERTO', ...data });
    return Response.json(conta);
  } catch (err) {
    console.error('POST /api/contasapagar error', err);
    return new Response(JSON.stringify({ error: 'Failed to create conta' }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connect();
    const { id } = await request.json();
    await ContasAPagar.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/contasapagar error', err);
    return new Response(JSON.stringify({ error: 'Failed to delete conta' }), { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { authOptions } = await import('../auth/[...nextauth]/route');
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
  } catch (err) {
    console.error('PATCH /api/contasapagar error', err);
    return new Response(JSON.stringify({ error: 'Failed to update status' }), { status: 500 });
  }
}
/* eslint-env node */
import ContasAPagar from '@/lib/db/models/ContasAPagar';
import Action from '@/lib/db/models/Action';
import connect from '@/lib/db/connect';
import { getServerSession } from 'next-auth';
import baseOptions from '@/lib/auth/authOptionsBase';
import { attachClientNameFromActions, attachColaboradorLabel, linkStaffNameToColaborador } from '@/lib/helpers/contasapagar';
import { validateContasAPagarCreate, validateContasAPagarUpdate } from '@/lib/validators/contasapagar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connect();
    // Ensure Action model is referenced explicitly for populate
    const { searchParams } = new globalThis.URL(request.url);
    const vencFrom = searchParams.get('vencFrom');
    const vencTo = searchParams.get('vencTo');
    const filter = {};
    if (vencFrom || vencTo) {
      filter.reportDate = {};
      if (vencFrom) filter.reportDate.$gte = new Date(vencFrom);
      if (vencTo) filter.reportDate.$lte = new Date(vencTo);
    }
    // Try populate; if it fails (bad refs), fall back to plain docs
    let contas;
    try {
      contas = await ContasAPagar.find(filter)
        .populate({ path: 'actionId', model: Action })
        .lean();
    } catch (populateErr) {
      try { process.stderr.write('Populate actionId failed, returning plain docs: ' + String(populateErr) + '\n'); } catch { void 0; /* noop */ }
      contas = await ContasAPagar.find(filter).lean();
    }
    const withDefaults = contas.map((c) => ({ ...c, status: c.status || 'ABERTO' }));
    await attachColaboradorLabel(withDefaults);
    await linkStaffNameToColaborador(withDefaults);
    await attachClientNameFromActions(withDefaults);

    return Response.json(withDefaults);
  } catch (err) {
    try { process.stderr.write('GET /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return new Response(JSON.stringify({ error: 'Failed to fetch contas a pagar' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();
    try { validateContasAPagarCreate(data); } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: e.status || 400 }); }
    const conta = await ContasAPagar.create({ status: 'ABERTO', ...data });
    return Response.json(conta);
  } catch (err) {
    try { process.stderr.write('POST /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
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
    try { process.stderr.write('DELETE /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return new Response(JSON.stringify({ error: 'Failed to delete conta' }), { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    await connect();
    const parsed = await request.json();
    try { validateContasAPagarUpdate(parsed); } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: e.status || 400 }); }
    const { id, status } = parsed;
    const updated = await ContasAPagar.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return Response.json(updated);
  } catch (err) {
    try { process.stderr.write('PATCH /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return new Response(JSON.stringify({ error: 'Failed to update status' }), { status: 500 });
  }
}
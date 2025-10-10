/* eslint-env node */
import ContasAPagar from '@/lib/db/models/ContasAPagar';
import Action from '@/lib/db/models/Action';
import connect from '@/lib/db/connect';
import { getServerSession } from 'next-auth';
import baseOptions from '@/lib/auth/authOptionsBase';
import { attachClientNameFromActions, attachColaboradorLabel, linkStaffNameToColaborador } from '@/lib/helpers/contasapagar';
import { validateContasAPagarCreate, validateContasAPagarUpdate } from '@/lib/validators/contasapagar';
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api/responses';

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

    return ok(withDefaults);
  } catch (err) {
    try { process.stderr.write('GET /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Failed to fetch contas a pagar');
  }
}

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();
    try { validateContasAPagarCreate(data); } catch (e) { return badRequest(e.message); }
    const conta = await ContasAPagar.create({ status: 'ABERTO', ...data });
    return created(conta);
  } catch (err) {
    try { process.stderr.write('POST /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Failed to create conta');
  }
}

export async function DELETE(request) {
  try {
    await connect();
    const { id } = await request.json();
    await ContasAPagar.findByIdAndDelete(id);
    return ok({ success: true });
  } catch (err) {
    try { process.stderr.write('DELETE /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Failed to delete conta');
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();
    await connect();
    const parsed = await request.json();
    try { validateContasAPagarUpdate(parsed); } catch (e) { return badRequest(e.message); }
    const { id, status } = parsed;
    const updated = await ContasAPagar.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return notFound('Not found');
    }
    return ok(updated);
  } catch (err) {
    try { process.stderr.write('PATCH /api/contasapagar error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return serverError('Failed to update status');
  }
}
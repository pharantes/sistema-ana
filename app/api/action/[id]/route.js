/* eslint-env node */
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import baseOptions from "../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import Cliente from "../../../../lib/db/models/Cliente.js";
import ContasAPagar from "../../../../lib/db/models/ContasAPagar.js";

export async function GET(request, context) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await (context?.params);
    const { id } = params || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await dbConnect();
    const action = await Action.findById(id).lean().exec();
    if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      const cid = String(action.client || '');
      if (/^[0-9a-fA-F]{24}$/.test(cid)) {
        const c = await Cliente.findById(cid).select('nome codigo').lean().exec();
        if (c) action.clientName = `${c.codigo ? c.codigo + ' ' : ''}${c.nome || ''}`.trim();
      }
    } catch { void 0; /* noop: ignore client resolve */ }
    return NextResponse.json(action, { status: 200 });
  } catch (err) {
    try { process.stderr.write('GET /api/action/[id] error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await (context?.params);
    const { id } = params || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await dbConnect();
    const deleted = await Action.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Cascade delete contas a pagar entries for this action
    try { await ContasAPagar.deleteMany({ actionId: id }); } catch { void 0; /* noop */ }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    try { process.stderr.write('DELETE /api/action/[id] error: ' + String(err) + '\n'); } catch { void 0; /* noop */ }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

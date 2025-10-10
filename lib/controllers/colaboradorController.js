/* eslint-env node */
import Colaborador from "@/lib/db/models/Colaborador";
import dbConnect from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import baseOptions from "@/lib/auth/authOptionsBase";
import { validateColaboradorCreate, validateColaboradorUpdate } from "@/lib/validators/colaborador";

export const colaboradorController = {
  async get() {
    await dbConnect();
    const colaboradores = await Colaborador.find().sort({ createdAt: -1 });
    return Response.json(colaboradores);
  },
  async post(req) {
    await dbConnect();
    const data = await req.json();
    try { validateColaboradorCreate(data); } catch (e) { return Response.json({ error: e.message }, { status: e.status || 400 }); }
    if (!data?.nome) {
      return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    const last = await Colaborador.findOne().sort({ codigo: -1 }).select('codigo').lean();
    let nextCodigo = '0001';
    if (last && last.codigo) {
      const n = parseInt(String(last.codigo).replace(/\D/g, ''), 10) || 0;
      nextCodigo = String(n + 1).padStart(4, '0');
    }
    const colaborador = await Colaborador.create({ ...data, codigo: nextCodigo });
    return Response.json(colaborador);
  },
  async patch(req) {
    await dbConnect();
    const data = await req.json();
    try { validateColaboradorUpdate(data); } catch (e) { return Response.json({ error: e.message }, { status: e.status || 400 }); }
    const { _id, ...update } = data;
    if (!_id) return Response.json({ error: "ID ausente." }, { status: 400 });
    const colaborador = await Colaborador.findByIdAndUpdate(_id, update, { new: true });
    return Response.json(colaborador);
  },
  async delete(req) {
    await dbConnect();
    const session = await getServerSession(baseOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Apenas administradores podem excluir colaboradores." }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID ausente." }, { status: 400 });
    await Colaborador.findByIdAndDelete(id);
    return Response.json({ ok: true });
  },
};

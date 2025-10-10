/* eslint-env node */
import Colaborador from "@/lib/db/models/Colaborador";
import dbConnect from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import baseOptions from "@/lib/auth/authOptionsBase";
import { validateColaboradorCreate, validateColaboradorUpdate } from "@/lib/validators/colaborador";
import { ok, created, badRequest, forbidden, serverError, tooManyRequests } from "@/lib/api/responses";
import { rateLimit } from "@/lib/utils/rateLimit";

const limiter = rateLimit({ windowMs: 10_000, limit: 30 });

export const colaboradorController = {
  async get() {
    try {
      await dbConnect();
      const colaboradores = await Colaborador.find({}, {
        codigo: 1, nome: 1, empresa: 1, pix: 1, banco: 1, conta: 1, uf: 1, telefone: 1, email: 1, tipo: 1, cnpjCpf: 1, createdAt: 1
      }).sort({ createdAt: -1 }).lean();
      return ok(colaboradores);
    } catch (e) {
      return serverError(e?.message || 'Erro ao listar colaboradores');
    }
  },
  async post(req) {
    try {
      limiter.check(req);
      await dbConnect();
      const data = await req.json();
      try { validateColaboradorCreate(data); } catch (e) { return badRequest(e.message); }
      if (!data?.nome) return badRequest("Nome é obrigatório.");
      const last = await Colaborador.findOne().sort({ codigo: -1 }).select('codigo').lean();
      let nextCodigo = '0001';
      if (last && last.codigo) {
        const n = parseInt(String(last.codigo).replace(/\D/g, ''), 10) || 0;
        nextCodigo = String(n + 1).padStart(4, '0');
      }
      const colaborador = await Colaborador.create({ ...data, codigo: nextCodigo });
      return created(colaborador);
    } catch (e) {
      if (e?.status === 429) return tooManyRequests('Too Many Requests');
      return serverError(e?.message || 'Erro ao criar colaborador');
    }
  },
  async patch(req) {
    try {
      limiter.check(req);
      await dbConnect();
      const data = await req.json();
      try { validateColaboradorUpdate(data); } catch (e) { return badRequest(e.message); }
      const { _id, ...update } = data;
      if (!_id) return badRequest("ID ausente.");
      const colaborador = await Colaborador.findByIdAndUpdate(_id, update, { new: true });
      return ok(colaborador);
    } catch (e) {
      if (e?.status === 429) return tooManyRequests('Too Many Requests');
      return serverError(e?.message || 'Erro ao atualizar colaborador');
    }
  },
  async delete(req) {
    try {
      limiter.check(req);
      await dbConnect();
      const session = await getServerSession(baseOptions);
      if (!session || session.user.role !== "admin") {
        return forbidden("Apenas administradores podem excluir colaboradores.");
      }
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (!id) return badRequest("ID ausente.");
      await Colaborador.findByIdAndDelete(id);
      return ok({ ok: true });
    } catch (e) {
      if (e?.status === 429) return tooManyRequests('Too Many Requests');
      return serverError(e?.message || 'Erro ao excluir colaborador');
    }
  },
};

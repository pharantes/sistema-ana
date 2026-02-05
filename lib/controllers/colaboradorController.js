/* eslint-env node */
import Colaborador from "@/lib/db/models/Colaborador";
import dbConnect from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import baseOptions from "@/lib/auth/authOptionsBase";
import { validateColaboradorCreate, validateColaboradorUpdate } from "@/lib/validators/colaborador";
import { ok, created, badRequest, forbidden, serverError, tooManyRequests } from "@/lib/api/responses";
import { rateLimit } from "@/lib/utils/rateLimit";

const requestLimiter = rateLimit({ windowMs: 10_000, limit: 30 });

const COLABORADOR_FIELDS = {
  codigo: 1,
  nome: 1,
  empresa: 1,
  pix: 1,
  banco: 1,
  conta: 1,
  uf: 1,
  telefone: 1,
  email: 1,
  tipo: 1,
  cnpjCpf: 1,
  createdAt: 1
};

function extractNumericCode(codigoString) {
  return parseInt(String(codigoString).replace(/\D/g, ''), 10) || 0;
}

function formatCodigo(numericCode) {
  return String(numericCode).padStart(4, '0');
}

async function generateNextColaboradorCodigo() {
  const lastColaborador = await Colaborador.findOne()
    .sort({ codigo: -1 })
    .select('codigo')
    .lean();

  if (!lastColaborador || !lastColaborador.codigo) {
    return '0001';
  }

  const numericCode = extractNumericCode(lastColaborador.codigo);
  return formatCodigo(numericCode + 1);
}

async function checkAdminPermission() {
  const session = await getServerSession(baseOptions);
  return session && (session.user.role === "admin" || session.user.role === "staff");
}

export const colaboradorController = {
  /**
   * GET handler - Retrieves all colaboradores with selected fields.
   */
  async get() {
    try {
      await dbConnect();
      const colaboradores = await Colaborador.find({}, COLABORADOR_FIELDS)
        .sort({ createdAt: -1 })
        .lean();
      return ok(colaboradores);
    } catch (error) {
      return serverError(error?.message || 'Erro ao listar colaboradores');
    }
  },

  /**
   * POST handler - Creates a new colaborador with auto-generated codigo.
   */
  async post(request) {
    try {
      requestLimiter.check(request);
      await dbConnect();

      const data = await request.json();

      try {
        validateColaboradorCreate(data);
      } catch (validationError) {
        return badRequest(validationError.message);
      }

      if (!data?.nome) {
        return badRequest("Nome é obrigatório.");
      }

      const nextCodigo = await generateNextColaboradorCodigo();
      const colaborador = await Colaborador.create({ ...data, codigo: nextCodigo });

      return created(colaborador);
    } catch (error) {
      if (error?.status === 429) {
        return tooManyRequests('Too Many Requests');
      }
      return serverError(error?.message || 'Erro ao criar colaborador');
    }
  },

  /**
   * PATCH handler - Updates an existing colaborador.
   */
  async patch(request) {
    try {
      requestLimiter.check(request);
      await dbConnect();

      const data = await request.json();

      try {
        validateColaboradorUpdate(data);
      } catch (validationError) {
        return badRequest(validationError.message);
      }

      const { _id, ...updateFields } = data;

      if (!_id) {
        return badRequest("ID ausente.");
      }

      const colaborador = await Colaborador.findByIdAndUpdate(_id, updateFields, { new: true });
      return ok(colaborador);
    } catch (error) {
      if (error?.status === 429) {
        return tooManyRequests('Too Many Requests');
      }
      return serverError(error?.message || 'Erro ao atualizar colaborador');
    }
  },

  /**
   * DELETE handler - Deletes a colaborador (admin only).
   */
  async delete(request) {
    try {
      requestLimiter.check(request);
      await dbConnect();

      const isAdmin = await checkAdminPermission();
      if (!isAdmin) {
        return forbidden("Apenas administradores e staff podem excluir colaboradores.");
      }

      const { searchParams } = new URL(request.url);
      const colaboradorId = searchParams.get("id");

      if (!colaboradorId) {
        return badRequest("ID ausente.");
      }

      await Colaborador.findByIdAndDelete(colaboradorId);
      return ok({ ok: true });
    } catch (error) {
      if (error?.status === 429) {
        return tooManyRequests('Too Many Requests');
      }
      return serverError(error?.message || 'Erro ao excluir colaborador');
    }
  },
};

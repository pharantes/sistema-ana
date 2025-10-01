import Servidor from "@/lib/db/models/Servidor";
import dbConnect from "@/lib/db/connect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const servidorController = {
  async get() {
    await dbConnect();
    const servidores = await Servidor.find();
    return Response.json(servidores);
  },
  async post(req) {
    await dbConnect();
    const data = await req.json();
    // Validate input
    if (!data.codigo || !data.nome || !data.pix || !data.banco || !data.uf || !data.telefone || !data.email || !data.tipo || !data.cnpjCpf) {
      return Response.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }
    // Prevent duplicate codigo
    const exists = await Servidor.findOne({ codigo: data.codigo });
    if (exists) {
      return Response.json({ error: "Servidor já existe." }, { status: 409 });
    }
    const servidor = await Servidor.create(data);
    return Response.json(servidor);
  },
  async patch(req) {
    await dbConnect();
    const data = await req.json();
    const { _id, ...update } = data;
    if (!_id) return Response.json({ error: "ID ausente." }, { status: 400 });
    const servidor = await Servidor.findByIdAndUpdate(_id, update, { new: true });
    return Response.json(servidor);
  },
  async delete(req) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Apenas administradores podem excluir servidores." }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID ausente." }, { status: 400 });
    await Servidor.findByIdAndDelete(id);
    return Response.json({ ok: true });
  },
};

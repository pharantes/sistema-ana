import { getServerSession } from "next-auth";
import baseOptions from "../../lib/auth/authOptionsBase";
import dbConnect from "@/lib/db/connect";
import Colaborador from "@/lib/db/models/Colaborador";
import { toPlainDocs } from "@/lib/utils/mongo";
import ColaboradoresClient from "./Client";

export default async function ColaboradoresPage() {
  const session = await getServerSession(baseOptions);
  const isAdmin = !!(session && session.user && session.user.role === "admin");
  await dbConnect();
  const raw = await Colaborador
    .find({}, 'codigo nome empresa pix banco conta uf telefone email tipo cnpjCpf createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const colaboradores = toPlainDocs(raw);
  return <ColaboradoresClient initialColaboradores={colaboradores} isAdmin={isAdmin} />;
}

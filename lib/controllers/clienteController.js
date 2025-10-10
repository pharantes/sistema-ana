import Cliente from "../../lib/db/models/Cliente";
import dbConnect from "../../lib/db/connect";

export async function getClientes() {
  await dbConnect();
  return await Cliente.find({}).sort({ createdAt: -1 });
}

export async function createCliente(data) {
  await dbConnect();
  // Require nome and minimal fields; auto-generate codigo
  if (!data?.nome) {
    throw new Error('Nome é obrigatório');
  }
  const last = await Cliente.findOne().sort({ codigo: -1 }).select('codigo').lean();
  let nextCodigo = '0001';
  if (last && last.codigo) {
    const n = parseInt(String(last.codigo).replace(/\D/g, ''), 10) || 0;
    nextCodigo = String(n + 1).padStart(4, '0');
  }
  const cliente = new Cliente({ ...data, codigo: nextCodigo });
  await cliente.save();
  return cliente;
}

export async function updateCliente(id, data) {
  await dbConnect();
  return await Cliente.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteCliente(id) {
  await dbConnect();
  return await Cliente.findByIdAndDelete(id);
}

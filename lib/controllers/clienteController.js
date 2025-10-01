import Cliente from "../../lib/db/models/Cliente";
import dbConnect from "../../lib/db/connect";

export async function getClientes() {
  await dbConnect();
  return await Cliente.find({});
}

export async function createCliente(data) {
  await dbConnect();
  const cliente = new Cliente(data);
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

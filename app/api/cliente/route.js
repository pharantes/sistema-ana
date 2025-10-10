import { getClientes, createCliente, updateCliente, deleteCliente } from "@/lib/controllers/clienteController";
import { validateClienteCreate, validateClienteUpdate } from "@/lib/validators/cliente";
import { ok, created, badRequest } from "@/lib/api/responses";

export async function GET() {
  const clientes = await getClientes();
  return ok(clientes);
}

export async function POST(request) {
  const data = await request.json();
  try { validateClienteCreate(data); } catch (e) { return badRequest(e.message); }
  const cliente = await createCliente(data);
  return created(cliente);
}

export async function PATCH(request) {
  const data = await request.json();
  try { validateClienteUpdate(data); } catch (e) { return badRequest(e.message); }
  const { _id, ...update } = data;
  const cliente = await updateCliente(_id, update);
  return ok(cliente);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const deleted = await deleteCliente(id);
  return ok(deleted);
}
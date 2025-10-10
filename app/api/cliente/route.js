import { getClientes, createCliente, updateCliente, deleteCliente } from "@/lib/controllers/clienteController";
import { validateClienteCreate, validateClienteUpdate } from "@/lib/validators/cliente";

export async function GET() {
  const clientes = await getClientes();
  return Response.json(clientes);
}

export async function POST(request) {
  const data = await request.json();
  try { validateClienteCreate(data); } catch (e) { return Response.json({ error: e.message }, { status: e.status || 400 }); }
  const cliente = await createCliente(data);
  return Response.json(cliente);
}

export async function PATCH(request) {
  const data = await request.json();
  try { validateClienteUpdate(data); } catch (e) { return Response.json({ error: e.message }, { status: e.status || 400 }); }
  const { _id, ...update } = data;
  const cliente = await updateCliente(_id, update);
  return Response.json(cliente);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const deleted = await deleteCliente(id);
  return Response.json(deleted);
}
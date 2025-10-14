import { getClientes, createCliente, updateCliente, deleteCliente } from "@/lib/controllers/clienteController";
import { validateClienteCreate, validateClienteUpdate } from "@/lib/validators/cliente";
import { ok, created, badRequest, serverError } from "@/lib/api/responses";

/**
 * GET handler - Retrieves all clientes.
 */
export async function GET() {
  try {
    const clientes = await getClientes();
    return ok(clientes);
  } catch (error) {
    return serverError(error?.message || 'Erro ao buscar clientes');
  }
}

/**
 * POST handler - Creates a new cliente with validation.
 */
export async function POST(request) {
  try {
    const data = await request.json();

    try {
      validateClienteCreate(data);
    } catch (validationError) {
      return badRequest(validationError.message);
    }

    const cliente = await createCliente(data);
    return created(cliente);
  } catch (error) {
    return serverError(error?.message || 'Erro ao criar cliente');
  }
}

/**
 * PATCH handler - Updates an existing cliente.
 */
export async function PATCH(request) {
  try {
    const data = await request.json();

    try {
      validateClienteUpdate(data);
    } catch (validationError) {
      return badRequest(validationError.message);
    }

    const { _id, ...updateFields } = data;
    const cliente = await updateCliente(_id, updateFields);
    return ok(cliente);
  } catch (error) {
    return serverError(error?.message || 'Erro ao atualizar cliente');
  }
}

/**
 * DELETE handler - Deletes a cliente by ID.
 */
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const deleted = await deleteCliente(id);
    return ok(deleted);
  } catch (error) {
    return serverError(error?.message || 'Erro ao excluir cliente');
  }
}
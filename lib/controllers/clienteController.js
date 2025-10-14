import Cliente from "../../lib/db/models/Cliente";
import dbConnect from "../../lib/db/connect";

function validateClienteData(data) {
  if (!data?.nome) {
    throw new Error('Nome é obrigatório');
  }
}

function extractNumericCode(codigoString) {
  return parseInt(String(codigoString).replace(/\D/g, ''), 10) || 0;
}

function formatCodigo(numericCode) {
  return String(numericCode).padStart(4, '0');
}

/**
 * Generates the next sequential codigo for a new cliente.
 */
async function generateNextCodigo() {
  const lastCliente = await Cliente.findOne()
    .sort({ codigo: -1 })
    .select('codigo')
    .lean();

  if (!lastCliente || !lastCliente.codigo) {
    return '0001';
  }

  const numericCode = extractNumericCode(lastCliente.codigo);
  return formatCodigo(numericCode + 1);
}

/**
 * Retrieves all clientes sorted by creation date (newest first).
 */
export async function getClientes() {
  await dbConnect();
  return await Cliente.find({}).sort({ createdAt: -1 });
}

/**
 * Creates a new cliente with auto-generated codigo.
 */
export async function createCliente(data) {
  await dbConnect();

  validateClienteData(data);

  const nextCodigo = await generateNextCodigo();
  const cliente = new Cliente({ ...data, codigo: nextCodigo });
  await cliente.save();

  return cliente;
}

/**
 * Updates an existing cliente by ID.
 */
export async function updateCliente(clienteId, updateData) {
  await dbConnect();
  return await Cliente.findByIdAndUpdate(clienteId, updateData, { new: true });
}

/**
 * Deletes a cliente by ID.
 */
export async function deleteCliente(clienteId) {
  await dbConnect();
  return await Cliente.findByIdAndDelete(clienteId);
}

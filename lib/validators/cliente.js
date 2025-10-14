/**
 * Cliente Validator - Zod schemas for cliente data validation
 */
import { z } from "zod";

/**
 * Required non-empty string validator
 */
const requiredString = z.string().min(1);

/**
 * Zod schema for creating a new cliente
 */
export const ClienteCreateSchema = z.object({
  nome: requiredString,
  endereco: requiredString,
  cidade: requiredString,
  uf: requiredString,
  telefone: requiredString,
  email: requiredString,
  nomeContato: requiredString,
  tipo: requiredString,
  cnpjCpf: requiredString,
  banco: z.string().optional(),
  conta: z.string().optional(),
  formaPgt: z.string().optional(),
}).passthrough();

/**
 * Zod schema for updating an existing cliente
 */
export const ClienteUpdateSchema = z.object({
  _id: z.string().min(1),
  nome: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  nomeContato: z.string().optional(),
  tipo: z.string().optional(),
  cnpjCpf: z.string().optional(),
  banco: z.string().optional(),
  conta: z.string().optional(),
  formaPgt: z.string().optional(),
}).passthrough();

/**
 * Aggregates validation errors into a single error message
 */
function aggregateValidationErrors(parsedResult) {
  if (parsedResult.success) return parsedResult.data;

  const errorMessage = parsedResult.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  const error = new Error(errorMessage);
  error.status = 400;
  throw error;
}

/**
 * Validates cliente creation data
 */
export function validateClienteCreate(input) {
  return aggregateValidationErrors(ClienteCreateSchema.safeParse(input));
}

/**
 * Validates cliente update data
 */
export function validateClienteUpdate(input) {
  return aggregateValidationErrors(ClienteUpdateSchema.safeParse(input));
}

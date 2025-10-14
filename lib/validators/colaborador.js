/**
 * Colaborador Validator - Zod schemas for colaborador data validation
 */
import { z } from "zod";

/**
 * MongoDB ObjectId pattern validator
 */
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Zod schema for creating a new colaborador
 */
export const ColaboradorCreateSchema = z.object({
  nome: z.string().min(1),
  empresa: z.string().optional(),
  pix: z.string().optional(),
  banco: z.string().optional(),
  conta: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  tipo: z.string().optional(),
  cnpjCpf: z.string().optional(),
}).passthrough();

/**
 * Zod schema for updating an existing colaborador
 */
export const ColaboradorUpdateSchema = z.object({
  _id: ObjectIdLike,
  nome: z.string().optional(),
  empresa: z.string().optional(),
  pix: z.string().optional(),
  banco: z.string().optional(),
  conta: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  tipo: z.string().optional(),
  cnpjCpf: z.string().optional(),
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
 * Validates colaborador creation data
 */
export function validateColaboradorCreate(input) {
  return aggregateValidationErrors(ColaboradorCreateSchema.safeParse(input));
}

/**
 * Validates colaborador update data
 */
export function validateColaboradorUpdate(input) {
  return aggregateValidationErrors(ColaboradorUpdateSchema.safeParse(input));
}

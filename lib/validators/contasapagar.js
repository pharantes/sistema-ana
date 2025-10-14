/**
 * ContasAPagar Validator - Zod schemas for payable accounts validation
 */
import { z } from "zod";

/**
 * MongoDB ObjectId pattern validator
 */
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Zod schema for creating a new conta a pagar
 */
export const ContasAPagarCreateSchema = z.object({
  actionId: ObjectIdLike,
  staffName: z.string().optional(),
  costId: ObjectIdLike.optional(),
  colaboradorId: ObjectIdLike.optional(),
  reportDate: z.string().optional(),
  status: z.enum(['ABERTO', 'PAGO']).optional(),
}).passthrough();

/**
 * Zod schema for updating an existing conta a pagar
 */
export const ContasAPagarUpdateSchema = z.object({
  id: ObjectIdLike,
  status: z.enum(['ABERTO', 'PAGO']),
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
 * Validates contas a pagar creation data
 */
export function validateContasAPagarCreate(input) {
  return aggregateValidationErrors(ContasAPagarCreateSchema.safeParse(input));
}

/**
 * Validates contas a pagar update data
 */
export function validateContasAPagarUpdate(input) {
  return aggregateValidationErrors(ContasAPagarUpdateSchema.safeParse(input));
}

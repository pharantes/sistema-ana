/**
 * ContaFixa Validator - Zod schemas for recurring expense validation
 */
import { z } from "zod";

/**
 * Zod schema for creating a new conta fixa
 */
export const ContaFixaCreateSchema = z.object({
  name: z.string().min(1),
  empresa: z.string().min(1),
  tipo: z.enum(['quizenal', 'mensal']),
  valor: z.union([z.number(), z.string()]).optional(),
  status: z.enum(['ABERTO', 'PAGO']).optional(),
  lastPaidAt: z.string().optional().nullable(),
  vencimento: z.string().optional().nullable(),
}).passthrough();

/**
 * Zod schema for updating an existing conta fixa
 */
export const ContaFixaUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  tipo: z.enum(['quizenal', 'mensal']).optional().nullable(),
  valor: z.union([z.number(), z.string(), z.null()]).optional(),
  status: z.enum(['ABERTO', 'PAGO']).optional(),
  lastPaidAt: z.union([z.string(), z.null()]).optional(),
  vencimento: z.union([z.string(), z.null()]).optional(),
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
 * Validates conta fixa creation data
 */
export function validateContaFixaCreate(input) {
  return aggregateValidationErrors(ContaFixaCreateSchema.safeParse(input));
}

/**
 * Validates conta fixa update data
 */
export function validateContaFixaUpdate(input) {
  return aggregateValidationErrors(ContaFixaUpdateSchema.safeParse(input));
}

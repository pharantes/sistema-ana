/**
 * ContasAReceber Validator - Zod schemas for receivable accounts validation
 */
import { z } from 'zod';

/**
 * MongoDB ObjectId pattern validator
 */
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Zod schema for upserting (create/update) a conta a receber with installment support
 */
export const ContasAReceberUpsertSchema = z.object({
  id: ObjectIdLike.optional(),
  actionId: ObjectIdLike,
  clientId: ObjectIdLike.optional(),
  reportDate: z.string().optional(),
  status: z.enum(['ABERTO', 'RECEBIDO']).optional(),
  banco: z.string().optional(),
  conta: z.string().optional(),
  formaPgt: z.string().optional(),
  descricao: z.string().optional(),
  recorrente: z.coerce.boolean().optional(),
  parcelas: z.coerce.boolean().optional(),
  qtdeParcela: z.coerce.number().int().min(1).optional(),
  valorParcela: z.coerce.number().optional(),
  valor: z.coerce.number().optional(),
  dataVencimento: z.string().optional(),
  dataRecebimento: z.string().optional(),
}).passthrough();

/**
 * Validates contas a receber upsert data
 */
export function validateContasAReceberUpsert(input) {
  const parsedResult = ContasAReceberUpsertSchema.safeParse(input);

  if (!parsedResult.success) {
    const errorMessage = parsedResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    const error = new Error(errorMessage);
    error.status = 400;
    throw error;
  }

  return parsedResult.data;
}

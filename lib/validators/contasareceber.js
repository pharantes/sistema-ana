import { z } from 'zod';

const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

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

export function validateContasAReceberUpsert(input) {
  const parsed = ContasAReceberUpsertSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

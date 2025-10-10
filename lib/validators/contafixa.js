import { z } from "zod";

export const ContaFixaCreateSchema = z.object({
  name: z.string().min(1),
  empresa: z.string().min(1),
  tipo: z.enum(['quizenal', 'mensal']),
  valor: z.union([z.number(), z.string()]).optional(),
  status: z.enum(['ABERTO', 'PAGO']).optional(),
  lastPaidAt: z.string().optional().nullable(),
  vencimento: z.string().optional().nullable(),
}).passthrough();

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

export function validateContaFixaCreate(input) {
  const parsed = ContaFixaCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

export function validateContaFixaUpdate(input) {
  const parsed = ContaFixaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

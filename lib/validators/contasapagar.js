import { z } from "zod";

const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const ContasAPagarCreateSchema = z.object({
  actionId: ObjectIdLike,
  staffName: z.string().optional(),
  costId: ObjectIdLike.optional(),
  colaboradorId: ObjectIdLike.optional(),
  reportDate: z.string().optional(),
  status: z.enum(['ABERTO', 'PAGO']).optional(),
}).passthrough();

export const ContasAPagarUpdateSchema = z.object({
  id: ObjectIdLike,
  status: z.enum(['ABERTO', 'PAGO']),
}).passthrough();

function aggregate(parsed) {
  if (parsed.success) return parsed.data;
  const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

export function validateContasAPagarCreate(input) { return aggregate(ContasAPagarCreateSchema.safeParse(input)); }
export function validateContasAPagarUpdate(input) { return aggregate(ContasAPagarUpdateSchema.safeParse(input)); }

import { z } from "zod";

const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

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

function aggregate(parsed) {
  if (parsed.success) return parsed.data;
  const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

export function validateColaboradorCreate(input) { return aggregate(ColaboradorCreateSchema.safeParse(input)); }
export function validateColaboradorUpdate(input) { return aggregate(ColaboradorUpdateSchema.safeParse(input)); }

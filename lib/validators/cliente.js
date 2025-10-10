import { z } from "zod";

const requiredString = z.string().min(1);
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

function aggregate(parsed) {
  if (parsed.success) return parsed.data;
  const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

export function validateClienteCreate(input) { return aggregate(ClienteCreateSchema.safeParse(input)); }
export function validateClienteUpdate(input) { return aggregate(ClienteUpdateSchema.safeParse(input)); }

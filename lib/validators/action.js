import { z } from "zod";

const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/).optional();

const StaffEntrySchema = z.object({
  name: z.string().min(1),
  value: z.union([z.number(), z.string()]).optional(), // we'll coerce later
  pix: z.string().optional(),
  bank: z.string().optional(),
  pgt: z.string().optional(),
  vencimento: z.string().optional(),
}).passthrough();

const CostEntrySchema = z.object({
  description: z.string().min(1),
  value: z.union([z.number(), z.string()]).optional(),
  pix: z.string().optional(),
  bank: z.string().optional(),
  pgt: z.string().optional(),
  vencimento: z.string().optional(),
  colaboradorId: ObjectIdLike.nullable().optional(),
  vendorName: z.string().optional(),
  vendorEmpresa: z.string().optional(),
  _id: ObjectIdLike.nullable().optional(),
}).passthrough();

export const ActionCreateSchema = z.object({
  name: z.string().optional(),
  event: z.string().optional(),
  client: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  dueDate: z.string().optional(),
  staff: z.array(StaffEntrySchema).optional(),
  costs: z.array(CostEntrySchema).optional(),
}).passthrough();

export const ActionUpdateSchema = ActionCreateSchema.extend({
  id: z.string().min(1),
});

export function validateActionCreate(input) {
  const parsed = ActionCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

export function validateActionUpdate(input) {
  const parsed = ActionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

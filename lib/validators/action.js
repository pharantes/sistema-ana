import { z } from "zod";

// Schema Definitions
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/).optional();

const StaffEntrySchema = z.object({
  name: z.string().min(1),
  value: z.union([z.number(), z.string()]).optional(),
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

const ActionCreateSchema = z.object({
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

const ActionUpdateSchema = ActionCreateSchema.extend({
  id: z.string().min(1),
});

// Helper Functions
function formatValidationErrors(zodError) {
  return zodError.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/**
 * Validates input data for action creation.
 * Throws a 400 error if validation fails.
 */
export function validateActionCreate(input) {
  const parseResult = ActionCreateSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMessage = formatValidationErrors(parseResult.error);
    throw createValidationError(errorMessage);
  }

  return parseResult.data;
}

/**
 * Validates input data for action update.
 * Throws a 400 error if validation fails.
 */
export function validateActionUpdate(input) {
  const parseResult = ActionUpdateSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMessage = formatValidationErrors(parseResult.error);
    throw createValidationError(errorMessage);
  }

  return parseResult.data;
}

// Export schemas for reuse
export { ActionCreateSchema, ActionUpdateSchema, StaffEntrySchema, CostEntrySchema };

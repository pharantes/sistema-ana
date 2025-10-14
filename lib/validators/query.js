/**
 * Query Validators - Common schemas for pagination and sorting
 */
import { z } from 'zod';

/**
 * Zod schema for pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Zod schema for sorting parameters
 */
export const SortSchema = z.object({
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Parses and validates query parameters against a schema
 */
export function parseQuery(schema, searchParams) {
  const queryObject = Object.fromEntries(searchParams.entries());
  const validationResult = schema.safeParse(queryObject);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map(error => error.message)
      .join('; ');
    const err = new Error(errorMessage);
    err.status = 400;
    throw err;
  }

  return validationResult.data;
}

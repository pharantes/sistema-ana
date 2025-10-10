import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const SortSchema = z.object({
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).default('desc'),
});

export function parseQuery(schema, searchParams) {
  const obj = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join('; ');
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return result.data;
}

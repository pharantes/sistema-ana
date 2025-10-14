/**
 * Actions Query Validator - Zod schema for action list query parameters
 */
import { z } from 'zod';
import { PaginationSchema, SortSchema, parseQuery } from './query';

/**
 * MongoDB ObjectId pattern validator
 */
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Zod schema for action list query parameters with filtering, sorting, and pagination
 */
export const ActionsQuerySchema = PaginationSchema.merge(SortSchema).extend({
  q: z.string().optional(),
  clientId: ObjectIdLike.optional(),
  colaboradorId: ObjectIdLike.optional(),
  colaboradorName: z.string().optional(),
  startFrom: z.string().optional(),
  startTo: z.string().optional(),
  endFrom: z.string().optional(),
  endTo: z.string().optional(),
  vencFrom: z.string().optional(),
  vencTo: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
});

/**
 * Parses and validates action query parameters
 */
export function parseActionsQuery(searchParams) {
  return parseQuery(ActionsQuerySchema, searchParams);
}

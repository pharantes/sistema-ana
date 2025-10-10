import { describe, it, expect } from 'vitest';
import { ActionsQuerySchema } from '../lib/validators/actionsQuery.js';

function paramsToSearchParams(obj) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null) sp.set(k, String(v));
  });
  return sp;
}

describe('ActionsQuerySchema', () => {
  it('accepts minimal empty query with defaults', () => {
    const obj = Object.fromEntries(paramsToSearchParams({}).entries());
    const parsed = ActionsQuerySchema.safeParse(obj);
    expect(parsed.success).toBe(true);
    expect(parsed.data.page).toBe(1);
    expect(parsed.data.pageSize).toBe(10);
    expect(parsed.data.dir).toBe('desc');
  });

  it('validates ObjectId-like fields', () => {
    const good = { colaboradorId: '65a1b2c3d4e5f67890123456' };
    const bad = { colaboradorId: 'not-an-id' };
    expect(ActionsQuerySchema.safeParse(Object.fromEntries(paramsToSearchParams(good).entries())).success).toBe(true);
    expect(ActionsQuerySchema.safeParse(Object.fromEntries(paramsToSearchParams(bad).entries())).success).toBe(false);
  });

  it('coerces pagination numbers', () => {
    const obj = Object.fromEntries(paramsToSearchParams({ page: '2', pageSize: '5' }).entries());
    const parsed = ActionsQuerySchema.safeParse(obj);
    expect(parsed.success).toBe(true);
    expect(parsed.data.page).toBe(2);
    expect(parsed.data.pageSize).toBe(5);
  });
});

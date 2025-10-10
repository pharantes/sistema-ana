import { describe, it, expect } from 'vitest';
import { toPlainDoc, toPlainDocs } from '../lib/utils/mongo.js';

describe('mongo utils', () => {
  it('toPlainDoc should stringify _id and dates', () => {
    const d = new Date('2024-01-02T03:04:05.000Z');
    const input = { _id: { toString: () => '65a1b2c3d4e5f67890123456' }, createdAt: d, other: 1 };
    const out = toPlainDoc(input);
    expect(out._id).toBe('65a1b2c3d4e5f67890123456');
    expect(out.createdAt).toBe(d.toISOString());
    expect(out.other).toBe(1);
  });

  it('toPlainDocs should map list', () => {
    const list = [{ _id: { toString: () => '1' } }, { _id: { toString: () => '2' } }];
    const out = toPlainDocs(list);
    expect(out).toEqual([{ _id: '1' }, { _id: '2' }]);
  });
});

import { describe, it, expect } from 'vitest';
import * as P from '../app/components/ui/primitives';

describe('ui/primitives exports', () => {
  it('exports expected primitives', () => {
    expect(P).toHaveProperty('InputWrap');
    expect(P).toHaveProperty('RowInline');
    expect(P).toHaveProperty('ActionsInline');
    expect(P).toHaveProperty('Loading');
    expect(P).toHaveProperty('LoadingDot');
  });
});

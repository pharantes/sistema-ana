"use client";
import styled from 'styled-components';
import { RowInline } from './primitives';

const Item = styled.div`
  display: flex;
  gap: var(--gap-xs, var(--gap-xs, var(--gap-xs, 6px)));
  align-items: center;
  font-size: var(--font-size-sm, 0.75rem);
  color: #374151;
`;
const Swatch = styled.div`
  width: var(--legend-swatch-width, var(--space-sm, var(--space-sm, 12px)));
  height: var(--legend-swatch-height, var(--space-xs, var(--space-xs, 8px)));
  border-radius: var(--legend-swatch-radius, 2px);
  background: ${p => p.color || 'transparent'};
`;

export default function Legend({ items = [] }) {
  return (
    <RowInline>
      {items.map((it) => (
        <Item key={it.label}>
          <Swatch color={it.color} />
          <div>{it.label}</div>
        </Item>
      ))}
    </RowInline>
  );
}

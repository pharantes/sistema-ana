"use client";
import { Note } from "./primitives";
import styled from 'styled-components';

const Root = styled.div`
  display: flex;
  gap: var(--gap-xs);
  align-items: center;
`;

const SmallSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: none;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px;
  padding: 4px 28px 4px 8px; /* room for chevron on right */
  height: calc(var(--control-height, 32px) - 6px);
  font-size: var(--font-size-sm, 0.95rem);
  cursor: pointer;
  box-sizing: border-box;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px 12px;
`;

// build-touch: updated to use primitives and styled Root instead of inline style prop
export default function PageSizeSelector({
  pageSize,
  total,
  onChange,
  options = [10, 25, 50],
  label = "Mostrar:",
  className,
}) {
  return (
    <Root className={className}>
      <Note>{label}</Note>
      <SmallSelect value={pageSize} onChange={(e) => onChange(Number(e.target.value))} aria-label="Items por página">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </SmallSelect>
      <Note>Total: {total}</Note>
    </Root>
  );
}

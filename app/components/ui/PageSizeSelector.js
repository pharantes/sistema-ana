"use client";
import { Note } from "./primitives";
import styled from 'styled-components';

const Root = styled.div`
  display: flex;
  gap: var(--gap-xs);
  align-items: center;
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
      <select value={pageSize} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <Note>Total: {total}</Note>
    </Root>
  );
}

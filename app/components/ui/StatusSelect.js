"use client";
import * as FE from "../FormElements";
import styled from 'styled-components';
import { getStatusColors } from "./statusColors";

const StyledSelect = styled(FE.Select)`
  border-color: rgba(0,0,0,0.05);
  background: ${p => p.bg || 'transparent'};
  color: ${p => p.fg || 'inherit'};
  /* Make the select visually match the SmallSecondaryButton / Editar button
     - width:auto so it doesn't stretch to the full column
     - a sensible min-width so short labels (like 'RE') still look like a pill
     - fixed height to align with buttons used in options column */
  width: auto !important;
  min-width: 84px;
  padding: 0 var(--space-xs, 8px) !important;
  height: calc(var(--control-height, 36px) - var(--space-xs, 8px));
  font-size: var(--font-size-sm, 0.9rem);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
`;

export default function StatusSelect({
  value,
  options = [],
  onChange,
  className,
  disabled,
  ...rest
}) {
  const key = String(value || '').toUpperCase();
  const c = getStatusColors(key);
  return (
    <StyledSelect value={value} onChange={onChange} disabled={disabled} bg={c.bg} fg={c.fg} className={className} {...rest}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </StyledSelect>
  );
}

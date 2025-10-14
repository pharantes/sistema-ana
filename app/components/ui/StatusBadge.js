"use client";
import styled from 'styled-components';
import { getStatusColors } from "./statusColors";

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm, 0.9rem);
  padding: 0 var(--space-xs, 8px);
  min-width: 84px;
  height: calc(var(--control-height, 36px) - var(--space-xs, 8px));
  border-radius: var(--radius-pill, 999px);
  border: 1px solid rgba(0,0,0,0.05);
  background: ${p => p.bg || '#fff'};
  color: ${p => p.fg || '#000'};
`;

export default function StatusBadge({ value, className }) {
  const key = String(value || '').toUpperCase();
  const c = getStatusColors(key);
  return (
    <Badge bg={c.bg} fg={c.fg} className={className}>
      {key || '-'}
    </Badge>
  );
}

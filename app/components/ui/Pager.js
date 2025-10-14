"use client";
import styled from "styled-components";
import { RowInline } from './primitives';

const Row = styled(RowInline)`
  justify-content: flex-end;
  margin-top: ${p => (p.$compact ? '0' : 'var(--space-xs, var(--space-xs, var(--space-xs, 8px)))')};
  display: ${p => (p.$inline ? 'inline-flex' : 'flex')};
  align-items: ${p => (p.$compact ? 'baseline' : 'center')};
`;

const PageButton = styled.button`
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  border: 1px solid #ddd;
  background: #fff;
  color: #111;
  min-height: calc(var(--control-height, 36px) - var(--space-xs, var(--space-xs, 8px)));
  &[data-active="true"] {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function Pager({
  page,
  pageSize,
  total,
  onChangePage,
  compact = false,
  inline = false,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize || 10)));
  if (totalPages <= 1) return null;
  return (
    <Row $compact={compact} $inline={inline}>
      <PageButton onClick={() => onChangePage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Anterior">«</PageButton>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <PageButton key={n} data-active={String(n === page)} onClick={() => onChangePage(n)}>{n}</PageButton>
      ))}
      <PageButton onClick={() => onChangePage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Próxima">»</PageButton>
    </Row>
  );
}

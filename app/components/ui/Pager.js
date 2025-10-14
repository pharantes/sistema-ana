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

const Ellipsis = styled.span`
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  color: #666;
  display: inline-flex;
  align-items: center;
  min-height: calc(var(--control-height, 36px) - var(--space-xs, var(--space-xs, 8px)));
`;

/**
 * Generates an array of page numbers and ellipsis markers to display
 * Shows max 4 page buttons plus ellipsis and last page
 */
function generatePageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisiblePages = 4;

  if (totalPages <= maxVisiblePages + 2) {
    // If we have 6 or fewer pages, show them all
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, start + maxVisiblePages - 2);

    // Adjust start if we're near the end
    if (end === totalPages - 1) {
      start = Math.max(2, end - (maxVisiblePages - 2));
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

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

  const pageNumbers = generatePageNumbers(page, totalPages);

  return (
    <Row $compact={compact} $inline={inline}>
      <PageButton onClick={() => onChangePage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Anterior">«</PageButton>
      {pageNumbers.map((n, idx) =>
        n === '...' ? (
          <Ellipsis key={`ellipsis-${idx}`}>...</Ellipsis>
        ) : (
          <PageButton key={n} data-active={String(n === page)} onClick={() => onChangePage(n)}>{n}</PageButton>
        )
      )}
      <PageButton onClick={() => onChangePage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Próxima">»</PageButton>
    </Row>
  );
}

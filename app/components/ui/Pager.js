"use client";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const PageButton = styled.button`
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #fff;
  color: #111;
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
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize || 10)));
  if (totalPages <= 1) return null;
  return (
    <Row>
      <PageButton onClick={() => onChangePage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Anterior">«</PageButton>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <PageButton key={n} data-active={String(n === page)} onClick={() => onChangePage(n)}>{n}</PageButton>
      ))}
      <PageButton onClick={() => onChangePage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Próxima">»</PageButton>
    </Row>
  );
}

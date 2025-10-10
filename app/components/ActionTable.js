"use client";
import styled from "styled-components";
import { SecondaryButton } from './FormElements';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { actionListColumns } from "../utils/columns";
import { formatDateBR } from "@/lib/utils/dates";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin: 8px 0 4px;
`;

const PaginationBar = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
`;

const PageBtn = styled.button`
  background: #fff;
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #111;
  &[data-active="true"] {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function ActionTable({ actions, session, onEdit, onDelete }) {
  const router = useRouter();
  const gotoAction = (id) => router.push(`/acoes/${id}`);
  const gotoCliente = (id) => router.push(`/clientes/${id}`);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('date'); // 'date' | 'event' | 'start' | 'end' | 'client'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const total = actions?.length || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  const sorted = useMemo(() => {
    const list = Array.isArray(actions) ? actions.slice() : [];
    const getVal = (a, key) => {
      if (!a) return null;
      switch (key) {
        case 'date': return a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        case 'event': return String(a.name || a.event || '').toLowerCase();
        case 'start': return a.startDate ? new Date(a.startDate).getTime() : 0;
        case 'end': return a.endDate ? new Date(a.endDate).getTime() : 0;
        case 'client': return String(a.clientName || a.client || '').toLowerCase();
        default: return 0;
      }
    };
    list.sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va || '');
      const sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [actions, sortKey, sortDir]);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'event' || key === 'client' ? 'asc' : 'desc'); }
  };

  return (
    <>
      <TopRow>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Anterior">«</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <PageBtn key={n} data-active={n === page} onClick={() => setPage(n)}>{n}</PageBtn>
          ))}
          <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Próxima">»</PageBtn>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
          <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {total}</span>
        </div>
      </TopRow>
      <Table>
        <thead>
          <tr>
            {actionListColumns.map(c => (
              <Th key={c.key} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(c.key)}>
                {c.label}{' '}
                {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
            ))}
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((a) => (
            <tr key={a._id}>
              <Td>{formatDateBR(a.date)}</Td>
              <Td style={{ textAlign: 'left' }}>
                <button onClick={() => gotoAction(a._id)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                  {a.name || a.event}
                </button>
              </Td>
              <Td>{formatDateBR(a.startDate)}</Td>
              <Td>{formatDateBR(a.endDate)}</Td>
              <Td style={{ textAlign: 'left' }}>
                <button onClick={() => gotoCliente(a.client)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                  {a.clientName || a.client}
                </button>
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                {(session.user.role === "admin" || (Array.isArray(a.staff) && a.staff.map(x => x.name).includes(session.user.username))) ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <SecondaryButton onClick={() => onEdit(a)}>Editar</SecondaryButton>
                    {session.user.role === "admin" && (
                      <SecondaryButton onClick={() => onDelete(a)}>Excluir</SecondaryButton>
                    )}
                  </div>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {total > pageSize && (
        <PaginationBar>
          <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Anterior">«</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <PageBtn key={n} data-active={n === page} onClick={() => setPage(n)}>{n}</PageBtn>
          ))}
          <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Próxima">»</PageBtn>
        </PaginationBar>
      )}
    </>
  );
}

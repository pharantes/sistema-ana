"use client";
import styled from "styled-components";
import { ActionsRow, SmallSecondaryButton, SmallInlineButton } from './FormElements';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { actionListColumns } from "../utils/columns";
import { formatDateBR } from "@/lib/utils/dates";
import { Table, ThClickable, Th, Td } from "./ui/Table";
import { RowEnd, RowTopGap } from './ui/primitives';
import LinkButton from './ui/LinkButton';
import Pager from "./ui/Pager";
import PageSizeSelector from "./ui/PageSizeSelector";

// Use shared Table, Th, Td (with zebra striping)
// TopRow/BottomRow reuse the shared RowInline primitive for compact inline controls

const TopRow = styled(RowEnd)`
  margin: var(--space-xs) 0 var(--space-xxs);
`;

const BottomRow = RowTopGap;

// Pagination now handled by shared Pager component

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
        <Pager page={page} pageSize={pageSize} total={total} onChangePage={setPage} compact inline />
        <PageSizeSelector pageSize={pageSize} total={total} onChange={(n) => { setPage(1); setPageSize(n); }} />
      </TopRow>
      <Table>
        <thead>
          <tr>
            {actionListColumns.map(c => (
              <ThClickable key={c.key} onClick={() => toggleSort(c.key)}>
                {c.label}{' '}
                {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
            ))}
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((a) => (
            <tr key={a._id}>
              <Td>{formatDateBR(a.date)}</Td>
              <Td>
                <LinkButton onClick={() => gotoAction(a._id)}>{a.name || a.event}</LinkButton>
              </Td>
              <Td>{formatDateBR(a.startDate)}</Td>
              <Td>{formatDateBR(a.endDate)}</Td>
              <Td>
                <LinkButton onClick={() => gotoCliente(a.client)}>{a.clientName || a.client}</LinkButton>
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                {(session.user.role === "admin" || (Array.isArray(a.staff) && a.staff.map(x => x.name).includes(session.user.username))) ? (
                  <ActionsRow>
                    <SmallSecondaryButton onClick={() => onEdit(a)}>Editar</SmallSecondaryButton>
                    {session.user.role === "admin" && (
                      <SmallInlineButton onClick={() => onDelete(a)}>Excluir</SmallInlineButton>
                    )}
                  </ActionsRow>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {total > pageSize && (
        <BottomRow>
          <Pager page={page} pageSize={pageSize} total={total} onChangePage={setPage} compact />
        </BottomRow>
      )}
    </>
  );
}

"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import { ActionsRow, SmallSecondaryButton, SmallInlineButton } from '../../components/FormElements';
import { formatDateBR } from "@/lib/utils/dates";

const columns = [
  { key: 'date', label: 'Data' },
  { key: 'event', label: 'Ação' },
  { key: 'start', label: 'Início' },
  { key: 'end', label: 'Fim' },
  { key: 'client', label: 'Cliente' },
];

export default function ActionListTable({ actions = [], session, onEdit, onDelete }) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const total = actions?.length || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

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
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
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
      <HeaderControls page={page} pageSize={pageSize} total={total} onChangePage={setPage} onChangePageSize={setPageSize} />
      <Table>
        <thead>
          <tr>
            {columns.map(c => (
              <Th key={c.key} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(c.key)}>
                {c.label} {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
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
                <button onClick={() => router.push(`/acoes/${a._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>
                  {a.name || a.event}
                </button>
              </Td>
              <Td>{formatDateBR(a.startDate)}</Td>
              <Td>{formatDateBR(a.endDate)}</Td>
              <Td style={{ textAlign: 'left' }}>
                <button onClick={() => router.push(`/clientes/${a.client}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>
                  {a.clientName || a.client}
                </button>
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
      {/* HeaderControls already renders pagination; no bottom duplicate needed */}
    </>
  );
}

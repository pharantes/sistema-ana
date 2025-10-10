"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import { formatDateBR } from "@/lib/utils/dates";

export default function ClienteAcoesTable({ actions = [] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState('date'); // 'date' | 'name' | 'start' | 'end'
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    const list = Array.isArray(actions) ? actions.slice() : [];
    const getVal = (a) => {
      switch (sortKey) {
        case 'name': return String(a?.name || a?.event || '').toLowerCase();
        case 'start': return a?.startDate ? new Date(a.startDate).getTime() : 0;
        case 'end': return a?.endDate ? new Date(a.endDate).getTime() : 0;
        case 'date':
        default: return a?.date ? new Date(a.date).getTime() : (a?.createdAt ? new Date(a.createdAt).getTime() : 0);
      }
    };
    list.sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      const sa = String(va || ''), sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [actions, sortKey, sortDir]);

  const total = sorted.length;
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  return (
    <>
      <HeaderControls page={page} pageSize={pageSize} total={total} onChangePage={setPage} onChangePageSize={setPageSize} />
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('date')}>
              Data {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('name')}>
              Nome {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('start')}>
              Início {sortKey === 'start' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('end')}>
              Fim {sortKey === 'end' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map(a => (
            <tr key={a._id}>
              <Td>{formatDateBR(a.date)}</Td>
              <Td style={{ textAlign: 'left' }}>
                <button onClick={() => router.push(`/acoes/${a._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>
                  {a.name || a.event}
                </button>
              </Td>
              <Td>{formatDateBR(a.startDate)}</Td>
              <Td>{formatDateBR(a.endDate)}</Td>
            </tr>
          ))}
          {!total && (
            <tr><Td colSpan={4} style={{ color: '#666' }}>Nenhuma ação encontrada para este cliente.</Td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}

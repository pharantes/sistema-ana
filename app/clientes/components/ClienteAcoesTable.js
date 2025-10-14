"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, ThClickable, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import HeaderControls from "../../components/ui/HeaderControls";
import { formatDateBR } from "@/lib/utils/dates";
import LinkButton from '../../components/ui/LinkButton';
import { Note } from "../../components/ui/primitives";

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
            <ThClickable onClick={() => toggleSort('date')}>
              Data {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => toggleSort('name')}>
              Nome {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => toggleSort('start')}>
              Início {sortKey === 'start' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => toggleSort('end')}>
              Fim {sortKey === 'end' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
          </tr>
        </thead>
        <tbody>
          {pageData.map(a => (
            <tr key={a._id}>
              <Td>{formatDateBR(a.date)}</Td>
              <LeftTd>
                <LinkButton onClick={() => router.push(`/acoes/${a._id}`)}>
                  {a.name || a.event}
                </LinkButton>
              </LeftTd>
              <Td>{formatDateBR(a.startDate)}</Td>
              <Td>{formatDateBR(a.endDate)}</Td>
            </tr>
          ))}
          {!total && (
            <tr><Td colSpan={4}><Note>Nenhuma ação encontrada para este cliente.</Note></Td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}

const LeftTd = styled(Td)`
  text-align: left;
`;

// Empty message uses shared Note

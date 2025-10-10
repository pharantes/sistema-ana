"use client";
import { useMemo } from "react";
import { Table, Th, Td } from "../../components/ui/Table";
import Pager from "../../components/ui/Pager";
import * as FE from "../../components/FormElements";

// Small, reusable Contas Fixas table with sorting and pagination
// Props:
// - rows: array of contas fixas
// - sortKey, sortDir, onToggleSort
// - page, pageSize, onChangePage
// - onChangePageSize
// - getDisplayStatus(c): function provided by parent for status computation
// - formatDateBR(date): function provided by parent for localized date
// - onEdit(c), onDelete(id), onStatusChange(c, next)
export default function ContasFixasTable({
  rows = [],
  sortKey = "vencimento",
  sortDir = "asc",
  onToggleSort,
  page = 1,
  pageSize = 10,
  onChangePage,
  onChangePageSize,
  getDisplayStatus,
  formatDateBR,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const total = rows.length;
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('nome')}>
              Nome {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('empresa')}>
              Empresa {sortKey === 'empresa' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('tipo')}>
              Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('valor')}>
              Valor {sortKey === 'valor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('vencimento')}>
              Vencimento {sortKey === 'vencimento' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort?.('status')}>
              Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((c) => (
            <tr key={c._id}>
              <Td>{c.name}</Td>
              <Td>{c.empresa}</Td>
              <Td style={{ textTransform: 'capitalize' }}>{c.tipo}</Td>
              <Td>{(c.valor != null && c.valor !== '') ? Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</Td>
              <Td>{formatDateBR?.(c.vencimento)}</Td>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FE.Select value={getDisplayStatus?.(c)} onChange={(e) => onStatusChange?.(c, e.target.value)}>
                    <option value="ABERTO">ABERTO</option>
                    <option value="PAGO">PAGO</option>
                  </FE.Select>
                  {getDisplayStatus?.(c) === 'PAGO' && c.lastPaidAt && (
                    <span style={{ fontSize: '0.8rem', color: '#555', border: '1px solid #ddd', padding: '2px 6px', borderRadius: 6 }}>
                      {new Date(c.lastPaidAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </Td>
              <Td>
                <FE.SecondaryButton onClick={() => onEdit?.(c)}>Editar</FE.SecondaryButton>
                <FE.InlineButton onClick={() => onDelete?.(c._id)}>Excluir</FE.InlineButton>
              </Td>
            </tr>
          ))}
          {!rows.length && (
            <tr><Td colSpan={7} style={{ color: '#666' }}>Nenhuma conta fixa cadastrada</Td></tr>
          )}
        </tbody>
      </Table>
      {total > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Pager page={page} pageSize={pageSize} total={total} onChangePage={onChangePage} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
            <select value={pageSize} onChange={(e) => { onChangePage?.(1); onChangePageSize?.(Number(e.target.value)); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {total}</span>
          </div>
        </div>
      )}
    </>
  );
}

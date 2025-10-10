"use client";
import { useMemo } from "react";
import { Table, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import * as FE from "../../components/FormElements";
import { formatMonthYearBR } from "@/lib/utils/dates";
import { formatBRL } from "../../utils/currency";

// Small, reusable Contas Fixas table with sorting and pagination
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
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((c) => (
            <tr key={c._id}>
              <Td>{c.name}</Td>
              <Td>{c.empresa}</Td>
              <Td style={{ textTransform: 'capitalize' }}>{c.tipo}</Td>
              <Td>{(c.valor != null && c.valor !== '') ? formatBRL(Number(c.valor || 0)) : '-'}</Td>
              <Td>{formatDateBR?.(c.vencimento)}</Td>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusSelect
                    value={getDisplayStatus?.(c)}
                    options={[{ value: 'ABERTO', label: 'ABERTO' }, { value: 'PAGO', label: 'PAGO' }]}
                    onChange={(e) => onStatusChange?.(c, e.target.value)}
                  />
                  {getDisplayStatus?.(c) === 'PAGO' && c.lastPaidAt && (
                    <span style={{ fontSize: '0.8rem', color: '#555', border: '1px solid #ddd', padding: '2px 6px', borderRadius: 6 }}>
                      {formatMonthYearBR(c.lastPaidAt)}
                    </span>
                  )}
                </div>
              </Td>
              <Td>
                <FE.ActionsRow>
                  <FE.SmallSecondaryButton onClick={() => onEdit?.(c)}>Editar</FE.SmallSecondaryButton>
                  <FE.SmallInlineButton onClick={() => onDelete?.(c._id)}>Excluir</FE.SmallInlineButton>
                </FE.ActionsRow>
              </Td>
            </tr>
          ))}
          {!rows.length && (
            <tr><Td colSpan={7} style={{ color: '#666' }}>Nenhuma conta fixa cadastrada</Td></tr>
          )}
        </tbody>
      </Table>
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={onChangePage}
        onChangePageSize={(n) => { onChangePage?.(1); onChangePageSize?.(n); }}
      />
    </>
  );
}


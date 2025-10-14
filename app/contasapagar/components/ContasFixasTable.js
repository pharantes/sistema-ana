"use client";
import { useMemo } from "react";
import { Table, ThClickable, Th, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import { RowInline } from '../../components/ui/primitives';
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import * as FE from "../../components/FormElements";
import { formatMonthYearBR } from "@/lib/utils/dates";
import { formatBRL } from "../../utils/currency";
import { Note } from "../../components/ui/primitives";

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
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={onChangePage}
        onChangePageSize={(n) => { onChangePage?.(1); onChangePageSize?.(n); }}
      />
      <Table>
        <thead>
          <tr>
            <ThClickable onClick={() => onToggleSort?.('nome')}>
              Nome {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort?.('empresa')}>
              Empresa {sortKey === 'empresa' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort?.('tipo')}>
              Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort?.('valor')}>
              Valor {sortKey === 'valor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort?.('vencimento')}>
              Vencimento {sortKey === 'vencimento' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort?.('status')}>
              Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((c) => (
            <tr key={c._id}>
              <Td>{c.name}</Td>
              <Td>{c.empresa}</Td>
              <CapitalTd>{c.tipo}</CapitalTd>
              <Td>{(c.valor != null && c.valor !== '') ? formatBRL(Number(c.valor || 0)) : '-'}</Td>
              <Td>{formatDateBR?.(c.vencimento)}</Td>
              <Td>
                <RowInline>
                  <StatusSelect
                    value={getDisplayStatus?.(c)}
                    options={[{ value: 'ABERTO', label: 'ABERTO' }, { value: 'PAGO', label: 'PAGO' }]}
                    onChange={(e) => onStatusChange?.(c, e.target.value)}
                  />
                  {getDisplayStatus?.(c) === 'PAGO' && c.lastPaidAt && (
                    <Badge>{formatMonthYearBR(c.lastPaidAt)}</Badge>
                  )}
                </RowInline>
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
            <tr><Td colSpan={7}><Note>Nenhuma conta fixa cadastrada</Note></Td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}

// Inline actions now use shared RowInline (default gap/alignment)

const Badge = styled.span`
  font-size: var(--font-size-sm, 0.8rem);
  color: #555;
  border: 1px solid #ddd;
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
`;

// Empty message now uses shared Note

const CapitalTd = styled(Td)`
  text-transform: capitalize;
`;


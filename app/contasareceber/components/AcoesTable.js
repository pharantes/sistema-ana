"use client";
import { CompactTable as Table, ThClickable, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import { RowInline } from '../../components/ui/primitives';
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

export default function AcoesTable({
  rows = [],
  page,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
  sortKey,
  sortDir,
  onToggleSort,
  onChangeStatus,
}) {
  return (
    <>
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={onChangePage}
        onChangePageSize={(n) => { onChangePage(1); onChangePageSize(n); }}
      />
      <ClickableTable>
        <thead>
          <tr>
            <ThClickable onClick={() => onToggleSort('date')}>
              Data {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('acao')}>
              Ação {sortKey === 'acao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('cliente')}>
              Cliente {sortKey === 'cliente' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable>Descrição</ThClickable>
            <ThClickable>Qtde Parcela</ThClickable>
            <ThClickable>Valor Parcela</ThClickable>
            <ThClickable>Valor total</ThClickable>
            <ThClickable onClick={() => onToggleSort('venc')}>
              Data Vencimento {sortKey === 'venc' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('receb')}>
              Data Recebimento {sortKey === 'receb' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable>Status</ThClickable>
            <ThClickable>Opções</ThClickable>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const r = row.receivable || {};
            const venc = formatDateBR(r?.dataVencimento);
            const receb = formatDateBR(r?.dataRecebimento);
            const data = formatDateBR(row?.date);
            return (
              <tr key={row._id} onClick={() => globalThis.location.assign(`/contasareceber/${row._id}`)}>
                <Td>{data}</Td>
                <Td>
                  <TruncateName>{row.name}</TruncateName>
                </Td>
                <Td>{row.clientName || ''}</Td>
                <Td>{r?.descricao || ''}</Td>
                <Td>{r?.qtdeParcela ?? ''}</Td>
                <Td>{r?.valorParcela != null ? `R$ ${formatBRL(Number(r.valorParcela))}` : ''}</Td>
                <Td>{r?.valor != null ? `R$ ${formatBRL(Number(r.valor))}` : ''}</Td>
                <Td>{venc}</Td>
                <Td>{receb}</Td>
                <Td>
                  <RowInline>
                    <StatusSelect
                      value={(r?.status || 'ABERTO')}
                      options={[{ value: 'ABERTO', label: 'ABERTO' }, { value: 'RECEBIDO', label: 'RECEBIDO' }]}
                      onChange={(e) => onChangeStatus(row, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </RowInline>
                </Td>
                <Td>
                  <ActionButton onClick={(e) => { e.stopPropagation(); onChangeStatus(row, null, { openModal: true }); }}>Editar</ActionButton>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ClickableTable>
    </>
  );
}

// Inline actions now use shared RowInline (default gap/alignment)

const ActionButton = styled.button`
  background: none;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  cursor: pointer;
`;

const TruncateName = styled.span`
  display: inline-block;
`;

// Make rows visually indicate clickability on this page only
const ClickableTable = styled(Table)`
  tbody tr {
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  tbody tr:hover {
    /* soft hover that works with zebra striping */
    background-color: rgba(0,0,0,0.03);
  }
  /* ensure interactive controls inside a row keep their native cursor */
  tbody tr :is(button, select, input, a) {
    cursor: auto;
  }
`;

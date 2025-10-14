"use client";
import { CompactTable as Table, ThClickable, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import { RowInline } from '../../components/ui/primitives';
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Table component for displaying accounts receivable (Contas a Receber) by action.
 * Shows sortable, paginated list with clickable rows and status management.
 * @param {object} props - Component props
 * @param {Array} props.rows - Array of action receivable objects
 * @param {number} props.page - Current page number
 * @param {number} props.pageSize - Number of items per page
 * @param {number} props.total - Total number of items
 * @param {Function} props.onChangePage - Handler for changing page
 * @param {Function} props.onChangePageSize - Handler for changing page size
 * @param {string} props.sortKey - Current sort key
 * @param {string} props.sortDir - Current sort direction ('asc' or 'desc')
 * @param {Function} props.onToggleSort - Handler for toggling sort
 * @param {Function} props.onChangeStatus - Handler for changing status or opening edit modal
 */
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
          {rows.map((actionRow) => {
            const receivableData = actionRow.receivable || {};
            const dueDate = formatDateBR(receivableData?.dataVencimento);
            const receivedDate = formatDateBR(receivableData?.dataRecebimento);
            const actionDate = formatDateBR(actionRow?.date);
            const currentStatus = receivableData?.status || 'ABERTO';
            const installmentValue = receivableData?.valorParcela != null
              ? `R$ ${formatBRL(Number(receivableData.valorParcela))}`
              : '';
            const totalValue = receivableData?.valor != null
              ? `R$ ${formatBRL(Number(receivableData.valor))}`
              : '';

            const handleRowClick = () => {
              globalThis.location.assign(`/contasareceber/${actionRow._id}`);
            };

            const handleEditClick = (event) => {
              event.stopPropagation();
              onChangeStatus(actionRow, null, { openModal: true });
            };

            const handleStatusChange = (event) => {
              event.stopPropagation();
              onChangeStatus(actionRow, event.target.value);
            };

            return (
              <tr key={actionRow._id} onClick={handleRowClick}>
                <Td>{actionDate}</Td>
                <Td>
                  <TruncateName>{actionRow.name}</TruncateName>
                </Td>
                <Td>{actionRow.clientName || ''}</Td>
                <Td>{receivableData?.descricao || ''}</Td>
                <Td>{receivableData?.qtdeParcela ?? ''}</Td>
                <Td>{installmentValue}</Td>
                <Td>{totalValue}</Td>
                <Td>{dueDate}</Td>
                <Td>{receivedDate}</Td>
                <Td>
                  <RowInline>
                    <StatusSelect
                      value={currentStatus}
                      options={[
                        { value: 'ABERTO', label: 'ABERTO' },
                        { value: 'RECEBIDO', label: 'RECEBIDO' }
                      ]}
                      onChange={handleStatusChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </RowInline>
                </Td>
                <Td>
                  <ActionButton onClick={handleEditClick}>
                    Editar
                  </ActionButton>
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

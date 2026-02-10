"use client";
import { CompactTable as Table, ThClickable, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import { RowInline } from '../../components/ui/primitives';
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Table component for displaying accounts receivable (Contas a Receber).
 * Shows sortable, paginated list with clickable rows and status management.
 * Each row represents a receivable record (one budget covering multiple actions).
 * @param {object} props - Component props
 * @param {Array} props.rows - Array of receivable objects
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
            <ThClickable onClick={() => onToggleSort('cliente')}>
              Cliente {sortKey === 'cliente' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable>
              Ações
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('descricao')}>
              Descrição {sortKey === 'descricao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('qtdeParcela')}>
              Qtde Parcela {sortKey === 'qtdeParcela' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('valorParcela')}>
              Valor Parcela {sortKey === 'valorParcela' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('valor')}>
              Valor total {sortKey === 'valor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('venc')}>
              Data Vencimento {sortKey === 'venc' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('receb')}>
              Data Recebimento {sortKey === 'receb' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('status')}>
              Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable>Opções</ThClickable>
          </tr>
        </thead>
        <tbody>
          {rows.map((receivable) => {
            // Calculate the due date to display
            let dueDateToShow = receivable?.dataVencimento;

            // If there are installments, find the next open one
            if (receivable?.installments && Array.isArray(receivable.installments) && receivable.installments.length > 0) {
              const nextOpenInstallment = receivable.installments.find(inst => inst.status === 'ABERTO');
              if (nextOpenInstallment && nextOpenInstallment.dueDate) {
                dueDateToShow = nextOpenInstallment.dueDate;
              }
            }

            const dueDate = formatDateBR(dueDateToShow);
            const receivedDate = formatDateBR(receivable?.dataRecebimento);
            const reportDate = formatDateBR(receivable?.reportDate);
            const currentStatus = receivable?.status || 'ABERTO';
            const installmentValue = receivable?.valorParcela != null
              ? `R$ ${formatBRL(Number(receivable.valorParcela))}`
              : '';
            const totalValue = receivable?.valor != null
              ? `R$ ${formatBRL(Number(receivable.valor))}`
              : '';

            // Format actions list
            const actionNames = (receivable.actions || [])
              .map(a => a.name || a.event || 'Sem nome')
              .join(', ');

            const handleRowClick = () => {
              globalThis.location.assign(`/contasareceber/${receivable._id}`);
            };

            const handleEditClick = (event) => {
              event.stopPropagation();
              onChangeStatus(receivable, null, { openModal: true });
            };

            const handleStatusChange = (event) => {
              event.stopPropagation();
              onChangeStatus(receivable, event.target.value);
            };

            const hasInstallments = receivable?.qtdeParcela && Number(receivable.qtdeParcela) > 1;

            return (
              <tr key={receivable._id} onClick={handleRowClick}>
                <Td>{reportDate}</Td>
                <Td>{receivable.clientName || ''}</Td>
                <Td>
                  <ActionsList title={actionNames}>
                    {actionNames || '-'}
                  </ActionsList>
                </Td>
                <Td>{receivable?.descricao || ''}</Td>
                <Td>{receivable?.qtdeParcela ?? ''}</Td>
                <Td>{installmentValue}</Td>
                <Td>{totalValue}</Td>
                <Td>{dueDate}</Td>
                <Td>{receivedDate}</Td>
                <Td>
                  <RowInline>
                    {hasInstallments ? (
                      <StatusBadge status={currentStatus} title="Status calculado automaticamente pelas parcelas">
                        {currentStatus}
                      </StatusBadge>
                    ) : (
                      <StatusSelect
                        value={currentStatus}
                        options={[
                          { value: 'ABERTO', label: 'ABERTO' },
                          { value: 'RECEBIDO', label: 'RECEBIDO' }
                        ]}
                        onChange={handleStatusChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
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

const ActionsList = styled.span`
  display: inline-block;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${props => props.status === 'RECEBIDO' ? '#d4edda' : '#fff3cd'};
  color: ${props => props.status === 'RECEBIDO' ? '#155724' : '#856404'};
`;

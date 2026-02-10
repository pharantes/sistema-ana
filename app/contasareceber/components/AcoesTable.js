"use client";
import { CompactTable as Table, ThClickable, Td } from "../../components/ui/Table";
import styled from 'styled-components';
import { RowInline } from '../../components/ui/primitives';
import { ActionsRow, SmallSecondaryButton, SmallInlineButton } from '../../components/FormElements';
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Table component for displaying accounts receivable installments.
 * Shows one row per installment - if a receivable has 5 installments, it shows 5 rows.
 * Each row displays the installment's specific due date and status.
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
 * @param {Function} props.onDelete - Handler for deleting receivable
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
  onDelete,
}) {
  // Expand receivables into installment rows
  const installmentRows = [];
  rows.forEach((receivable) => {
    const actionNames = (receivable.actions || [])
      .map(a => a.name || a.event || 'Sem nome')
      .join(', ');

    // If receivable has installments, create one row per installment
    if (receivable?.installments && Array.isArray(receivable.installments) && receivable.installments.length > 0) {
      receivable.installments.forEach((installment, idx) => {
        installmentRows.push({
          _id: `${receivable._id}-${idx}`,
          receivableId: receivable._id,
          installmentNumber: installment.number,
          isInstallment: true,
          reportDate: receivable.reportDate,
          clientName: receivable.clientName,
          actionNames,
          descricao: receivable.descricao,
          qtdeParcela: receivable.qtdeParcela,
          valorParcela: installment.value,
          valor: receivable.valor,
          dataVencimento: installment.dueDate,
          dataRecebimento: installment.paidDate,
          status: installment.status,
          receivable, // Keep reference for editing
        });
      });
    } else {
      // No installments - create single row for the receivable
      installmentRows.push({
        _id: receivable._id,
        receivableId: receivable._id,
        installmentNumber: null,
        isInstallment: false,
        reportDate: receivable.reportDate,
        clientName: receivable.clientName,
        actionNames,
        descricao: receivable.descricao,
        qtdeParcela: receivable.qtdeParcela,
        valorParcela: receivable.valorParcela,
        valor: receivable.valor,
        dataVencimento: receivable.dataVencimento,
        dataRecebimento: receivable.dataRecebimento,
        status: receivable.status,
        receivable,
      });
    }
  });

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
          {installmentRows.map((row) => {
            const dueDate = formatDateBR(row.dataVencimento);
            const receivedDate = formatDateBR(row.dataRecebimento);
            const reportDate = formatDateBR(row.reportDate);
            const currentStatus = row.status || 'ABERTO';
            const installmentValue = row.valorParcela != null
              ? `R$ ${formatBRL(Number(row.valorParcela))}`
              : '';
            const totalValue = row.valor != null
              ? `R$ ${formatBRL(Number(row.valor))}`
              : '';

            const handleRowClick = () => {
              globalThis.location.assign(`/contasareceber/${row.receivableId}`);
            };

            const handleEditClick = (event) => {
              event.stopPropagation();
              onChangeStatus(row.receivable, null, { openModal: true });
            };

            const handleDeleteClick = (event) => {
              event.stopPropagation();
              onDelete(row.receivable);
            };

            const handleStatusChange = (event) => {
              event.stopPropagation();
              const newStatus = event.target.value;
              // Pass installment information if this is an installment row
              const updateInfo = row.isInstallment
                ? { installmentNumber: row.installmentNumber, newStatus }
                : null;
              onChangeStatus(row.receivable, newStatus, updateInfo);
            };

            return (
              <tr key={row._id} onClick={handleRowClick}>
                <Td>{reportDate}</Td>
                <Td>{row.clientName || ''}</Td>
                <Td>
                  <ActionsList title={row.actionNames}>
                    {row.actionNames || '-'}
                  </ActionsList>
                </Td>
                <Td>{row.descricao || ''}</Td>
                <Td>{row.qtdeParcela ?? ''}</Td>
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
                  <ActionsRow>
                    <SmallSecondaryButton onClick={handleEditClick}>
                      Editar
                    </SmallSecondaryButton>
                    <SmallInlineButton onClick={handleDeleteClick}>
                      Excluir
                    </SmallInlineButton>
                  </ActionsRow>
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

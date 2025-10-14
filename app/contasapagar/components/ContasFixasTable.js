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

/**
 * Table component for displaying Contas Fixas (Fixed Accounts).
 * Shows sortable, paginated list with status management and CRUD operations.
 * @param {object} props - Component props
 * @param {Array} props.rows - Array of fixed account objects
 * @param {string} props.sortKey - Current sort key
 * @param {string} props.sortDir - Current sort direction ('asc' or 'desc')
 * @param {Function} props.onToggleSort - Handler for toggling sort
 * @param {number} props.page - Current page number
 * @param {number} props.pageSize - Number of items per page
 * @param {Function} props.onChangePage - Handler for changing page
 * @param {Function} props.onChangePageSize - Handler for changing page size
 * @param {Function} props.getDisplayStatus - Function to get display status for an account
 * @param {Function} props.formatDateBR - Function to format dates in BR format
 * @param {Function} props.onEdit - Handler for editing an account
 * @param {Function} props.onDelete - Handler for deleting an account
 * @param {Function} props.onStatusChange - Handler for changing account status
 */
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
  const totalRows = rows.length;

  /**
   * Paginates the rows based on current page and page size.
   */
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, page, pageSize]);

  return (
    <>
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={totalRows}
        onChangePage={onChangePage}
        onChangePageSize={(newSize) => {
          onChangePage?.(1);
          onChangePageSize?.(newSize);
        }}
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
          {paginatedRows.map((fixedAccount) => {
            const displayStatus = getDisplayStatus?.(fixedAccount);
            const isPaid = displayStatus === 'PAGO' && fixedAccount.lastPaidAt;
            const formattedValue = (fixedAccount.valor != null && fixedAccount.valor !== '')
              ? formatBRL(Number(fixedAccount.valor || 0))
              : '-';

            return (
              <tr key={fixedAccount._id}>
                <Td>{fixedAccount.name}</Td>
                <Td>{fixedAccount.empresa}</Td>
                <CapitalTd>{fixedAccount.tipo}</CapitalTd>
                <Td>{formattedValue}</Td>
                <Td>{formatDateBR?.(fixedAccount.vencimento)}</Td>
                <Td>
                  <RowInline>
                    <StatusSelect
                      value={displayStatus}
                      options={[
                        { value: 'ABERTO', label: 'ABERTO' },
                        { value: 'PAGO', label: 'PAGO' }
                      ]}
                      onChange={(e) => onStatusChange?.(fixedAccount, e.target.value)}
                    />
                    {isPaid && (
                      <Badge>{formatMonthYearBR(fixedAccount.lastPaidAt)}</Badge>
                    )}
                  </RowInline>
                </Td>
                <Td>
                  <FE.ActionsRow>
                    <FE.SmallSecondaryButton onClick={() => onEdit?.(fixedAccount)}>
                      Editar
                    </FE.SmallSecondaryButton>
                    <FE.SmallInlineButton onClick={() => onDelete?.(fixedAccount._id)}>
                      Excluir
                    </FE.SmallInlineButton>
                  </FE.ActionsRow>
                </Td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <Td colSpan={7}>
                <Note>Nenhuma conta fixa cadastrada</Note>
              </Td>
            </tr>
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


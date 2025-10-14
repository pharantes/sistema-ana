"use client";
import { CompactTable as Table, ThClickable, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import ColaboradorCell from "../../components/ui/ColaboradorCell";
import StatusSelect from "../../components/ui/StatusSelect";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatBRL } from "../../utils/currency";
import { formatDateBR } from "@/lib/utils/dates";
import LinkButton from '../../components/ui/LinkButton';

/**
 * Finds a staff member by name in the action data.
 * @param {object} report - The report object
 * @returns {object|null} The staff object or null
 */
function findStaffMember(report) {
  if (!report.staffName) return null;
  const staffList = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
  return staffList.find(staffMember => staffMember.name === report.staffName) || null;
}

/**
 * Finds a cost item by ID in the action data.
 * @param {object} report - The report object
 * @returns {object|null} The cost object or null
 */
function findCostItem(report) {
  if (report.staffName || !report.costId) return null;
  const costsList = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
  return costsList.find(cost => String(cost._id) === String(report.costId)) || null;
}

/**
 * Gets the description from cost item.
 * @param {object} report - The report object
 * @returns {string} The description
 */
function getCostDescription(report) {
  const costItem = findCostItem(report);
  return costItem?.description || '';
}

/**
 * Gets the due date from staff member or cost item.
 * @param {object} report - The report object
 * @returns {string} The formatted due date
 */
function getDueDate(report) {
  const staffMember = findStaffMember(report);
  const costItem = findCostItem(report);
  const dueDate = staffMember?.vencimento || costItem?.vencimento;
  return formatDateBR(dueDate);
}

/**
 * Gets the value from staff member or cost item.
 * @param {object} report - The report object
 * @returns {string} The formatted value
 */
function getValue(report) {
  const staffMember = findStaffMember(report);
  const costItem = findCostItem(report);
  const valueAmount = (staffMember && typeof staffMember.value !== 'undefined')
    ? Number(staffMember.value)
    : (costItem && typeof costItem.value !== 'undefined')
      ? Number(costItem.value)
      : null;
  return (valueAmount != null) ? formatBRL(valueAmount) : '';
}

/**
 * Gets the payment type from staff member or cost item.
 * @param {object} report - The report object
 * @returns {string} The payment type
 */
function getPaymentType(report) {
  const staffMember = findStaffMember(report);
  const costItem = findCostItem(report);
  return staffMember?.pgt || costItem?.pgt || '';
}

/**
 * Gets the bank/PIX information based on payment method.
 * @param {object} report - The report object
 * @returns {string} The bank or PIX details
 */
function getBankOrPix(report) {
  const staffMember = findStaffMember(report);
  const costItem = findCostItem(report);
  const paymentMethod = (staffMember?.pgt || costItem?.pgt || '').toUpperCase();
  if (paymentMethod === 'PIX') return staffMember?.pix || costItem?.pix || '';
  if (paymentMethod === 'TED') return staffMember?.bank || costItem?.bank || '';
  return '';
}

/**
 * Table component for displaying Custos Ações (Action Costs).
 * Shows sortable columns with payment details and status management.
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
  session,
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
      <Table>
        <thead>
          <tr>
            <ThClickable onClick={() => onToggleSort('created')}>
              Data {sortKey === 'created' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('acao')}>
              Ação {sortKey === 'acao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('colaborador')}>
              Colaborador/Empresa {sortKey === 'colaborador' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Descrição</Th>
            <ThClickable onClick={() => onToggleSort('due')}>
              Vencimento {sortKey === 'due' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Valor</Th>
            <Th>Pgt</Th>
            <Th>Banco/PIX</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(report => {
            const actionDate = report.actionId?.date
              ? formatDateBR(report.actionId.date)
              : formatDateBR(report.reportDate);
            const actionName = report.actionId?.name || "";
            const currentStatus = (report.status || "ABERTO").toUpperCase();

            return (
              <tr key={report._id}>
                <Td>{actionDate}</Td>
                <Td>
                  {report?.actionId?._id ? (
                    <LinkButton onClick={() => globalThis.location.assign(`/acoes/${report.actionId._id}`)}>
                      {actionName}
                    </LinkButton>
                  ) : actionName}
                </Td>
                <Td><ColaboradorCell report={report} /></Td>
                <Td>{getCostDescription(report)}</Td>
                <Td>{getDueDate(report)}</Td>
                <Td>{getValue(report)}</Td>
                <Td>{getPaymentType(report)}</Td>
                <Td>{getBankOrPix(report)}</Td>
                <Td>
                  {session.user.role === "admin" ? (
                    <StatusSelect
                      value={currentStatus}
                      options={[
                        { value: 'ABERTO', label: 'ABERTO' },
                        { value: 'PAGO', label: 'PAGO' }
                      ]}
                      onChange={(e) => onChangeStatus(
                        report._id,
                        e.target.value,
                        report.status || "ABERTO"
                      )}
                    />
                  ) : (
                    <StatusBadge value={currentStatus} />
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}

"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Formats a staff member's value as Brazilian Real currency
 */
function formatStaffValue(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return `R$ ${formatBRL(numericValue)}`;
  }
  return 'R$ 0,00';
}

/**
 * Finds a colaborador by matching name (case-insensitive)
 */
function findColaboradorByName(colaboradores, staffName) {
  const normalizedName = String(staffName || '').toLowerCase();
  return colaboradores.find(colab =>
    String(colab?.nome || '').toLowerCase() === normalizedName
  );
}

/**
 * Gets payment method from staff entry or action default
 */
function getPaymentMethod(staffEntry, action) {
  return (staffEntry?.pgt || action?.paymentMethod || '').toUpperCase();
}

/**
 * Builds bank info string from colaborador data
 */
function buildBankInfo(colaborador) {
  if (!colaborador) return '';

  const banco = colaborador.banco || '';
  const conta = colaborador.conta || '';

  return `${banco}${conta ? ` ${conta}` : ''}`.trim();
}

/**
 * Gets the appropriate payment info (PIX or bank) based on payment method
 */
function getPaymentInfo(staffEntry, action, colaboradores) {
  const paymentMethod = getPaymentMethod(staffEntry, action);
  const colaborador = findColaboradorByName(colaboradores, staffEntry?.name);

  if (paymentMethod === 'PIX') {
    return staffEntry?.pix || colaborador?.pix || '';
  }

  if (paymentMethod === 'TED') {
    return staffEntry?.bank || buildBankInfo(colaborador);
  }

  return '';
}

/**
 * Gets the due date for a staff entry, falling back to action due date
 */
function getStaffDueDate(staffEntry, action) {
  return staffEntry?.vencimento
    ? formatDateBR(staffEntry.vencimento)
    : formatDateBR(action?.dueDate);
}

/**
 * StaffTable - Displays staff members associated with an action
 */
export default function StaffTable({ acao, staff = [], colaboradores = [] }) {
  const staffList = Array.isArray(staff) ? staff : [];

  return (
    <Table>
      <thead>
        <tr>
          <Th>Profissional</Th>
          <Th>Valor</Th>
          <Th>Pgt</Th>
          <Th>Banco/PIX</Th>
          <Th>Vencimento</Th>
        </tr>
      </thead>
      <tbody>
        {staffList.map((staffEntry, index) => (
          <tr key={`${acao?._id || 'acao'}-staff-${index}`}>
            <Td>{staffEntry?.name || ''}</Td>
            <Td>{formatStaffValue(staffEntry?.value)}</Td>
            <Td>{staffEntry?.pgt || acao?.paymentMethod || ''}</Td>
            <Td>{getPaymentInfo(staffEntry, acao, colaboradores)}</Td>
            <Td>{getStaffDueDate(staffEntry, acao)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { Table, Th, Td } from "../../components/ui/Table";
import LinkButton from "../../components/ui/LinkButton";
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
 * Builds bank info string from colaborador data
 */
function buildBankInfo(colaborador) {
  if (!colaborador) return '';

  const banco = colaborador.banco || '';
  const conta = colaborador.conta || '';

  return `${banco}${conta ? ` ${conta}` : ''}`.trim();
}

/**
 * Gets PIX info from staff entry or fallback to colaborador
 */
function getPix(staffEntry, colaboradores) {
  if (staffEntry?.pix) return staffEntry.pix;

  const colaborador = findColaboradorByName(colaboradores, staffEntry?.name);
  return colaborador?.pix || '';
}

/**
 * Gets bank info from staff entry or fallback to colaborador
 */
function getBank(staffEntry, colaboradores) {
  if (staffEntry?.bank) return staffEntry.bank;

  const colaborador = findColaboradorByName(colaboradores, staffEntry?.name);
  return buildBankInfo(colaborador);
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
  const router = useRouter();
  const staffList = Array.isArray(staff) ? staff : [];

  const handleColaboradorClick = (staffName) => {
    const colaborador = findColaboradorByName(colaboradores, staffName);
    if (colaborador?._id) {
      router.push(`/colaboradores/${colaborador._id}`);
    }
  };

  return (
    <Table>
      <thead>
        <tr>
          <Th>Profissional</Th>
          <Th>Valor</Th>
          <Th>Pgt</Th>
          <Th>Banco</Th>
          <Th>PIX</Th>
          <Th>Vencimento</Th>
        </tr>
      </thead>
      <tbody>
        {staffList.map((staffEntry, index) => {
          const colaborador = findColaboradorByName(colaboradores, staffEntry?.name);
          const hasColaborador = !!colaborador?._id;

          return (
            <tr key={`${acao?._id || 'acao'}-staff-${index}`}>
              <Td>
                {hasColaborador ? (
                  <LinkButton onClick={() => handleColaboradorClick(staffEntry?.name)}>
                    {staffEntry?.name || ''}
                  </LinkButton>
                ) : (
                  staffEntry?.name || ''
                )}
              </Td>
              <Td>{formatStaffValue(staffEntry?.value)}</Td>
              <Td>{staffEntry?.pgt || acao?.paymentMethod || ''}</Td>
              <Td>{getBank(staffEntry, colaboradores)}</Td>
              <Td>{getPix(staffEntry, colaboradores)}</Td>
              <Td>{getStaffDueDate(staffEntry, acao)}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

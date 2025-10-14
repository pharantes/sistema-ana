"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import * as FE from "../../components/FormElements";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Formats a cost value as Brazilian Real currency
 */
function formatCostValue(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return `R$ ${formatBRL(numericValue)}`;
  }
  return 'R$ 0,00';
}

/**
 * Finds a colaborador by ID
 */
function findColaboradorById(colaboradores, colaboradorId) {
  if (!colaboradorId) return null;

  return colaboradores.find(colab =>
    String(colab._id) === String(colaboradorId)
  );
}

/**
 * Gets the vendor name from linked colaborador or cost entry
 */
function getVendorName(cost, linkedColaborador) {
  return linkedColaborador?.nome || cost?.vendorName || '';
}

/**
 * Gets the vendor empresa from linked colaborador or cost entry
 */
function getVendorEmpresa(cost, linkedColaborador) {
  return linkedColaborador?.empresa || cost?.vendorEmpresa || '';
}

/**
 * Gets the payment info (PIX or bank) based on payment method
 */
function getCostPaymentInfo(cost) {
  const paymentMethod = String(cost?.pgt || '').toUpperCase();

  if (paymentMethod === 'PIX') {
    return cost?.pix || '';
  }

  if (paymentMethod === 'TED') {
    return cost?.bank || '';
  }

  return '';
}

/**
 * CostsTable - Displays extra costs associated with an action
 */
export default function CostsTable({ acao, costs = [], colaboradores = [], onEdit, onDelete }) {
  const costsList = Array.isArray(costs) ? costs : [];

  return (
    <Table>
      <thead>
        <tr>
          <Th>Nome</Th>
          <Th>Empresa</Th>
          <Th>Descrição</Th>
          <Th>Valor</Th>
          <Th>Pgt</Th>
          <Th>Banco/PIX</Th>
          <Th>Vencimento</Th>
          <Th>Opções</Th>
        </tr>
      </thead>
      <tbody>
        {costsList.map((cost, index) => {
          const linkedColaborador = findColaboradorById(colaboradores, cost?.colaboradorId);
          const vendorName = getVendorName(cost, linkedColaborador);
          const vendorEmpresa = getVendorEmpresa(cost, linkedColaborador);

          return (
            <tr key={`${acao?._id || 'acao'}-cost-${index}`}>
              <Td>{vendorName}</Td>
              <Td>{vendorEmpresa}</Td>
              <Td>{cost?.description || ''}</Td>
              <Td>{formatCostValue(cost?.value)}</Td>
              <Td>{cost?.pgt || ''}</Td>
              <Td>{getCostPaymentInfo(cost)}</Td>
              <Td>{formatDateBR(cost?.vencimento)}</Td>
              <Td>
                <FE.ActionsRow>
                  <FE.SmallSecondaryButton onClick={() => onEdit?.(cost, index)}>
                    Editar
                  </FE.SmallSecondaryButton>
                  <FE.SmallInlineButton onClick={() => onDelete?.(index)}>
                    Excluir
                  </FE.SmallInlineButton>
                </FE.ActionsRow>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

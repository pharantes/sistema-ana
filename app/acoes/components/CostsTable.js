"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import * as FE from "../../components/FormElements";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

export default function CostsTable({ acao, costs = [], colaboradores = [], onEdit, onDelete }) {
  const list = Array.isArray(costs) ? costs : [];
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
        {list.map((c, idx) => {
          const linkId = c?.colaboradorId || '';
          const sel = linkId ? colaboradores.find(s => String(s._id) === String(linkId)) : null;
          const nome = sel?.nome || c?.vendorName || '';
          const empresa = sel?.empresa || c?.vendorEmpresa || '';
          return (
            <tr key={`${acao?._id || 'acao'}-c-${idx}`}>
              <Td>{nome}</Td>
              <Td>{empresa}</Td>
              <Td>{c?.description || ''}</Td>
              <Td>{`R$ ${Number.isFinite(Number(c?.value)) ? formatBRL(Number(c.value)) : '0,00'}`}</Td>
              <Td>{c?.pgt || ''}</Td>
              <Td>{(() => { const m = String(c?.pgt || '').toUpperCase(); if (m === 'PIX') return c?.pix || ''; if (m === 'TED') return c?.bank || ''; return ''; })()}</Td>
              <Td>{formatDateBR(c?.vencimento)}</Td>
              <Td>
                <FE.ActionsRow>
                  <FE.SmallSecondaryButton onClick={() => onEdit?.(c, idx)}>Editar</FE.SmallSecondaryButton>
                  <FE.SmallInlineButton onClick={() => onDelete?.(idx)}>Excluir</FE.SmallInlineButton>
                </FE.ActionsRow>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

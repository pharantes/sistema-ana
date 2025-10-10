"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

export default function StaffTable({ acao, staff = [], colaboradores = [] }) {
  const list = Array.isArray(staff) ? staff : [];
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
        {list.map((s, idx) => (
          <tr key={`${acao?._id || 'acao'}-s-${idx}`}>
            <Td>{s?.name || ''}</Td>
            <Td>{`R$ ${Number.isFinite(Number(s?.value)) ? formatBRL(Number(s.value)) : '0,00'}`}</Td>
            <Td>{(s?.pgt || acao?.paymentMethod || '')}</Td>
            <Td>{(() => {
              const m = String(s?.pgt || acao?.paymentMethod || '').toUpperCase();
              const colab = colaboradores.find(v => String(v?.nome || '').toLowerCase() === String(s?.name || '').toLowerCase());
              const pixVal = s?.pix || colab?.pix || '';
              const bankVal = s?.bank || (colab ? `${colab.banco || ''}${colab.conta ? ` ${colab.conta}` : ''}`.trim() : '');
              if (m === 'PIX') return pixVal;
              if (m === 'TED') return bankVal;
              return '';
            })()}</Td>
            <Td>{(s?.vencimento ? formatDateBR(s.vencimento) : formatDateBR(acao?.dueDate))}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

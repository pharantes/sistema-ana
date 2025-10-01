"use client";
import styled from "styled-components";
import * as FE from './FormElements';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;

export default function ActionTable({ actions, session, onEdit, onDelete }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Data</Th>
          <Th>Pgt</Th>
          <Th>Cliente</Th>
          <Th>Profissional</Th>
          <Th>Evento</Th>
          <Th>Valor</Th>
          <Th>Vencimento</Th>
          <Th>PIX</Th>
          <Th>Banco</Th>
          <Th>Ações</Th>
        </tr>
      </thead>
      <tbody>
        {actions.flatMap((a) => {
          const staffList = Array.isArray(a.staff) ? a.staff : [];
          return (staffList.length ? staffList : [null]).map((s, idx) => (
            <tr key={`${a._id}-${idx}`}>
              <Td>{a.date ? new Date(a.date).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>{a.paymentMethod || ""}</Td>
              <Td>{a.client}</Td>
              <Td>{s ? s.name : ""}</Td>
              <Td>{a.name || a.event}</Td>
              <Td>{s ? `R$ ${Number(s.value || 0).toFixed(2)}` : ""}</Td>
              <Td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>{s ? s.pix : ""}</Td>
              <Td>{s ? s.bank : ""}</Td>
              <Td>
                {(session.user.role === "admin" || (Array.isArray(a.staff) && a.staff.map(x => x.name).includes(session.user.username))) ? (
                  <>
                    <button onClick={() => onEdit(a)}>Editar</button>
                    {session.user.role === "admin" && (
                      <FE.InlineButton onClick={() => onDelete(a)}>Excluir</FE.InlineButton>
                    )}
                  </>
                ) : null}
              </Td>
            </tr>
          ));
        })}
      </tbody>
    </Table>
  );
}

"use client";
import { useSession } from "next-auth/react";
import styled from "styled-components";


const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
`;

import { useEffect, useState } from "react";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;

export default function ContasAReceberPage() {
  const { data: session, status } = useSession();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { fetchActions(); }, []);

  async function fetchActions() {
    setLoading(true);
    const res = await fetch("/api/action");
    const data = await res.json();
    setActions(data);
    setLoading(false);
  }

  async function handleSave(id) {
    setLoading(true);
    await fetch("/api/action/edit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value: editValue }),
    });
    setEditId(null);
    setEditValue("");
    fetchActions();
    setLoading(false);
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session || session.user.role !== "admin") {
    return <Wrapper><Title>Acesso restrito</Title><p>Somente administradores podem acessar esta página.</p></Wrapper>;
  }
  return (
    <Wrapper>
      <Title>Contas a Receber</Title>
      <Table>
        <thead>
          <tr>
            <Th>Evento</Th>
            <Th>Cliente</Th>
            <Th>Valor a Receber</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {actions.map(action => (
            <tr key={action._id}>
              <Td>{action.name}</Td>
              <Td>{action.client}</Td>
              <Td>
                {editId === action._id ? (
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} />
                ) : (
                  action.value ? `R$ ${Number(action.value).toFixed(2)}` : "-"
                )}
              </Td>
              <Td>
                {editId === action._id ? (
                  <button onClick={() => handleSave(action._id)} disabled={loading}>Salvar</button>
                ) : (
                  <button onClick={() => { setEditId(action._id); setEditValue(action.value || ""); }}>Editar</button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}

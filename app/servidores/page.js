"use client";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const Wrapper = styled.div`
  padding: 24px;
`;
const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
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
const Form = styled.form`
  margin-top: 24px;
  display: grid;
  gap: 8px;
  max-width: 500px;
`;

export default function ServidoresPage() {
  const { data: session, status } = useSession();
  const [servidores, setServidores] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", telefon: "", bank: "", account: "", pix: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchServidores(); }, []);

  async function fetchServidores() {
    setLoading(true);
    const res = await fetch("/api/servidor");
    const data = await res.json();
    setServidores(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const url = editing ? "/api/servidor" : "/api/servidor";
    const method = editing ? "PATCH" : "POST";
    const body = editing ? { ...form, _id: editing } : form;
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setForm({ name: "", address: "", telefon: "", bank: "", account: "", pix: "" });
    setEditing(null);
    fetchServidores();
    setLoading(false);
  }

  function startEdit(servidor) {
    setEditing(servidor._id);
    setForm({ name: servidor.name, address: servidor.address, telefon: servidor.telefon, bank: servidor.bank, account: servidor.account, pix: servidor.pix });
  }

  async function handleDelete(id) {
    setLoading(true);
    await fetch("/api/servidor", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ _id: id }) });
    fetchServidores();
    setLoading(false);
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <Wrapper><Title>Acesso restrito</Title><p>Faça login para acessar.</p></Wrapper>;

  return (
    <Wrapper>
      <Title>Servidores</Title>
      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Endereço</Th>
            <Th>Telefone</Th>
            <Th>Banco</Th>
            <Th>Conta</Th>
            <Th>PIX</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {servidores.map(servidor => (
            <tr key={servidor._id}>
              <Td>{servidor.name}</Td>
              <Td>{servidor.address}</Td>
              <Td>{servidor.telefon}</Td>
              <Td>{servidor.bank}</Td>
              <Td>{servidor.account}</Td>
              <Td>{servidor.pix}</Td>
              <Td>
                <button onClick={() => startEdit(servidor)}>Editar</button>
                <button onClick={() => handleDelete(servidor._id)} style={{ marginLeft: 8 }}>Excluir</button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Form onSubmit={handleSubmit}>
        <input placeholder="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <input placeholder="Endereço" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
        <input placeholder="Telefone" value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} required />
        <input placeholder="Banco" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} required />
        <input placeholder="Conta" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} required />
        <input placeholder="PIX" value={form.pix} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))} required />
        <button type="submit" disabled={loading}>{editing ? "Salvar" : "Adicionar"}</button>
        {editing ? (
          <button type="button" onClick={() => { setEditing(null); setForm({ name: "", address: "", telefon: "", bank: "", account: "", pix: "" }); }}>Cancelar</button>
        ) : null}
      </Form>
    </Wrapper>
  );
}

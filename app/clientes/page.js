"use client";
import styled from "styled-components";
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
  max-width: 400px;
`;

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", telefon: "", bank: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchClientes(); }, []);

  async function fetchClientes() {
    setLoading(true);
    const res = await fetch("/api/cliente");
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const url = "/api/cliente";
    const method = editing ? "PATCH" : "POST";
    const body = editing ? { ...form, _id: editing } : form;
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setForm({ name: "", address: "", telefon: "", bank: "" });
    setEditing(null);
    fetchClientes();
    setLoading(false);
  }

  function startEdit(cliente) {
    setEditing(cliente._id);
    setForm({ name: cliente.name, address: cliente.address, telefon: cliente.telefon, bank: cliente.bank });
  }

  async function handleDelete(id) {
    setLoading(true);
    await fetch(`/api/cliente?id=${id}`, { method: "DELETE" });
    fetchClientes();
    setLoading(false);
  }

  return (
    <Wrapper>
      <Title>Clientes</Title>
      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Endereço</Th>
            <Th>Telefone</Th>
            <Th>Banco</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => (
            <tr key={cliente._id}>
              <Td>{cliente.name}</Td>
              <Td>{cliente.address}</Td>
              <Td>{cliente.telefon}</Td>
              <Td>{cliente.bank}</Td>
              <Td>
                <button onClick={() => startEdit(cliente)}>Editar</button>
                <button onClick={() => handleDelete(cliente._id)} style={{ marginLeft: 8 }}>Excluir</button>
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
        <button type="submit" disabled={loading}>{editing ? "Salvar" : "Adicionar"}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", address: "", telefon: "", bank: "" }); }}>Cancelar</button>}
      </Form>
    </Wrapper>
  );
}

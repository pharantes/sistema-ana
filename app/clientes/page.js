"use client";
import styled from "styled-components";
import { useEffect, useState } from "react";
import ClienteModal from "../components/ClienteModal";
import DeleteModal from "../components/DeleteModal";

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


export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    setLoading(true);
    const res = await fetch("/api/cliente");
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }

  async function handleCreate(cliente) {
    setLoading(true);
    await fetch("/api/cliente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });
    await fetchClientes();
    setModalOpen(false);
    setLoading(false);
  }

  async function handleEdit(cliente) {
    setEditing({ ...cliente });
    setModalOpen(true);
  }

  async function handleUpdate(cliente) {
    setLoading(true);
    await fetch("/api/cliente", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cliente, _id: editing._id }),
    });
    await fetchClientes();
    setEditing(null);
    setModalOpen(false);
    setLoading(false);
  }

  function openDeleteModal(cliente) {
    setDeleteTarget(cliente);
    setConfirmCodigo("");
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(e) {
    e.preventDefault();
    // Pad confirmCodigo and deleteTarget.codigo to 4 digits and compare as strings
    const paddedInput = String(confirmCodigo).padStart(4, "0");
    const paddedTarget = String(deleteTarget.codigo).padStart(4, "0");
    if (paddedInput !== paddedTarget) return;
    setDeleteLoading(true);
    await fetch("/api/cliente", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget._id }),
    });
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setConfirmCodigo("");
    await fetchClientes();
    setDeleteLoading(false);
  }

  function handleModalClose() {
    setEditing(null);
    setModalOpen(false);
  }

  // Simulate admin role for demo; replace with real session.user.role === "admin" in production
  const isAdmin = true;
  return (
    <Wrapper>
      <Title>Clientes</Title>
      <button style={{ marginBottom: 16 }} onClick={() => setModalOpen(true)}>Novo Cliente</button>
      {loading ? <p>Carregando...</p> : (
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Nome do Cliente</Th>
              <Th>Endereço</Th>
              <Th>Cidade</Th>
              <Th>UF</Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <Th>Nome do contato</Th>
              <Th>Tipo</Th>
              <Th>CNPJ/CPF</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente._id}>
                <Td>{cliente.codigo}</Td>
                <Td>{cliente.nome}</Td>
                <Td>{cliente.endereco}</Td>
                <Td>{cliente.cidade}</Td>
                <Td>{cliente.uf}</Td>
                <Td>{cliente.telefone}</Td>
                <Td>{cliente.email}</Td>
                <Td>{cliente.nomeContato}</Td>
                <Td>{cliente.tipo}</Td>
                <Td>{cliente.cnpjCpf}</Td>
                <Td>
                  <button onClick={() => handleEdit(cliente)}>Editar</button>
                  {isAdmin && (
                    <button onClick={() => openDeleteModal(cliente)} style={{ marginLeft: 8 }}>Excluir</button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ClienteModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
      {deleteModalOpen && (
        <DeleteModal
          action={deleteTarget ? { ...deleteTarget, entityType: "Cliente" } : null}
          confirmName={confirmCodigo}
          setConfirmName={setConfirmCodigo}
          onCancel={() => { setDeleteModalOpen(false); setDeleteTarget(null); setConfirmCodigo(""); }}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          label="Digite o código do cliente para confirmar a exclusão:"
        />
      )}
    </Wrapper>
  );
}
// ...existing code...

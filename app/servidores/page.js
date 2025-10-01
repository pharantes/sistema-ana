"use client";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import DeleteModal from "../components/DeleteModal";
import { useEffect, useState } from "react";
import ServidorModal from "../components/ServidorModal";

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

function useServidorApi() {
  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchServidores() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/servidor");
      const data = await res.json();
      setServidores(data);
    } catch (err) {
      setError("Erro ao carregar servidores.");
    }
    setLoading(false);
  }

  return { servidores, fetchServidores, loading, error };
}

export default function ServidoresPage() {
  const { data: session } = useSession();
  const { servidores, fetchServidores, loading, error } = useServidorApi();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchServidores();
  }, []);

  async function handleCreate(servidor) {
    setFormError("");
    const res = await fetch("/api/servidor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(servidor),
    });
    const result = await res.json();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    await fetchServidores();
    setModalOpen(false);
  }

  async function handleEdit(servidor) {
    setEditing({ ...servidor });
    setModalOpen(true);
  }

  async function handleUpdate(servidor) {
    setFormError("");
    const res = await fetch("/api/servidor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...servidor, _id: editing._id }),
    });
    const result = await res.json();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    await fetchServidores();
    setEditing(null);
    setModalOpen(false);
  }

  function handleModalClose() {
    setEditing(null);
    setModalOpen(false);
  }

  function startEdit(servidor) {
    handleEdit(servidor);
  }

  function openDeleteModal(servidor) {
    setDeleteTarget(servidor);
    setConfirmCodigo("");
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(e) {
    e.preventDefault();
    if (!session || session.user.role !== "admin") return;
    if (confirmCodigo !== deleteTarget.codigo) return;
    setDeleteLoading(true);
    await fetch(`/api/servidor?id=${deleteTarget._id}`, { method: "DELETE" });
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setConfirmCodigo("");
    await fetchServidores();
    setDeleteLoading(false);
  }

  return (
    <Wrapper>
      <Title>Servidores</Title>
      <button style={{ marginBottom: 16 }} onClick={() => setModalOpen(true)}>Novo Servidor</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Carregando...</p> : (
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Nome do Fornecedor</Th>
              <Th>PIX</Th>
              <Th>Banco</Th>
              <Th>UF</Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <Th>Tipo</Th>
              <Th>CNPJ/CPF</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {servidores.map(servidor => (
              <tr key={servidor._id}>
                <Td>{servidor.codigo}</Td>
                <Td>{servidor.nome}</Td>
                <Td>{servidor.pix}</Td>
                <Td>{servidor.banco}</Td>
                <Td>{servidor.uf}</Td>
                <Td>{servidor.telefone}</Td>
                <Td>{servidor.email}</Td>
                <Td>{servidor.tipo}</Td>
                <Td>{servidor.cnpjCpf}</Td>
                <Td>
                  <button onClick={() => handleEdit(servidor)}>Editar</button>
                  {session?.user?.role === "admin" && (
                    <button onClick={() => openDeleteModal(servidor)} style={{ marginLeft: 8 }}>Excluir</button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ServidorModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
      <DeleteModal
        action={deleteTarget ? { ...deleteTarget, entityType: "Servidor" } : null}
        confirmName={confirmCodigo}
        setConfirmName={setConfirmCodigo}
        onCancel={() => { setDeleteModalOpen(false); setDeleteTarget(null); setConfirmCodigo(""); }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        label="Digite o código do servidor para confirmar a exclusão:"
      />
    </Wrapper>
  );
}

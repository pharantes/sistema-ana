"use client";
/* eslint-env browser */
import styled from "styled-components";
import { RowWrap } from '../components/ui/primitives';
import { useRouter } from 'next/navigation';
import { SearchBar } from "../components/ui";
import { useEffect, useState, useMemo } from "react";
import ClienteModal from "../components/ClienteModal";
import * as FE from "../components/FormElements";
import DeleteModal from "../components/DeleteModal";
import { ClientesTableWithFooter } from "./components/ClientesTable";

const Wrapper = styled.div`
  padding: var(--page-padding);
`;
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
const TopControls = RowWrap;
// SmallNote imported from primitives

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => { const t = setTimeout(() => setQuery(q.trim().toLowerCase()), 250); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    setLoading(true);
    const res = await globalThis.fetch("/api/cliente");
    const data = await res.json();
    // ensure newest-first if backend isn't sorted for legacy data
    const sorted = Array.isArray(data)
      ? data.slice().sort((a, b) => {
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      : [];
    setClientes(sorted);
    setLoading(false);
  }
  const total = clientes?.length || 0;
  // sorting
  const [sortKey, setSortKey] = useState('createdAt'); // 'codigo' | 'nome' | 'cidade' | 'uf' | 'tipo' | 'createdAt'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'nome' || key === 'cidade' ? 'asc' : 'desc'); }
  };
  const sorted = useMemo(() => {
    let list = Array.isArray(clientes) ? clientes.slice() : [];
    if (query) {
      list = list.filter(c => {
        const nome = String(c?.nome || '').toLowerCase();
        const contato = String(c?.nomeContato || '').toLowerCase();
        const email = String(c?.email || '').toLowerCase();
        const cidade = String(c?.cidade || '').toLowerCase();
        return nome.includes(query) || contato.includes(query) || email.includes(query) || cidade.includes(query);
      });
    }
    const getVal = (c) => {
      switch (sortKey) {
        case 'codigo': return String(c?.codigo ?? '').padStart(4, '0');
        case 'nome': return String(c?.nome ?? '').toLowerCase();
        case 'cidade': return String(c?.cidade ?? '').toLowerCase();
        case 'uf': return String(c?.uf ?? '').toLowerCase();
        case 'tipo': return String(c?.tipo ?? '').toLowerCase();
        case 'createdAt': default: return c?.createdAt ? new Date(c.createdAt).getTime() : 0;
      }
    };
    list.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      const sa = String(va || '');
      const sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [clientes, sortKey, sortDir]);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  async function handleCreate(cliente) {
    setLoading(true);
    await globalThis.fetch("/api/cliente", {
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
    await globalThis.fetch("/api/cliente", {
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
    await globalThis.fetch("/api/cliente", {
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
      <TopControls>
        <FE.TopButton onClick={() => setModalOpen(true)}>Novo Cliente</FE.TopButton>
        <SearchBar value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="Buscar por nome, contato, email ou cidade..." />
      </TopControls>
      {loading ? <p>Carregando...</p> : (
        <ClientesTableWithFooter
          rows={pageData}
          page={page}
          pageSize={pageSize}
          total={total}
          onChangePage={setPage}
          onChangePageSize={setPageSize}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onEdit={handleEdit}
          onDelete={openDeleteModal}
          onOpenDetails={(c) => router.push(`/clientes/${c._id}`)}
          canDelete={isAdmin}
        />
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

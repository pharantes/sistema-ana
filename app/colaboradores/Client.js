"use client";
/* eslint-env browser */
import styled from "styled-components";
import { useRouter } from 'next/navigation';
import Pager from "../components/ui/Pager";
import DeleteModal from "../components/DeleteModal";
import { useEffect, useState, useCallback } from "react";
import * as FE from "../components/FormElements";
import { Note } from "../components/FormLayout";
import ColaboradorModal from "../components/ColaboradorModal";

const Wrapper = styled.div`
  padding: 16px;
`;
const Title = styled.h1`
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 6px;
`;
const Td = styled.td`
  padding: 6px;
`;

function useColaboradorApi(initial = []) {
  const [colaboradores, setColaboradores] = useState(Array.isArray(initial) ? initial : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchColaboradores = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await globalThis.fetch("/api/colaborador");
      const data = await res.json();
      const sorted = Array.isArray(data)
        ? data.slice().sort((a, b) => {
          const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        })
        : [];
      setColaboradores(sorted);
    } catch {
      setError("Erro ao carregar colaboradores.");
    }
    setLoading(false);
  }, []);

  return { colaboradores, setColaboradores, fetchColaboradores, loading, error };
}

export default function ColaboradoresClient({ initialColaboradores = [], isAdmin = false }) {
  const router = useRouter();
  const { colaboradores, fetchColaboradores, loading, error } = useColaboradorApi(initialColaboradores);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortKey, setSortKey] = useState('createdAt'); // 'codigo' | 'nome' | 'empresa' | 'uf' | 'tipo' | 'createdAt'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'nome' || key === 'empresa' ? 'asc' : 'desc'); }
  };

  // Optional refresh on mount to ensure freshness if SSR cache is stale
  useEffect(() => {
    if (!Array.isArray(initialColaboradores) || initialColaboradores.length === 0) {
      fetchColaboradores();
    }
  }, [fetchColaboradores, initialColaboradores]);

  async function handleCreate(colaborador) {
    const res = await globalThis.fetch("/api/colaborador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(colaborador),
    });
    const result = await res.json();
    if (result.error) { globalThis.alert(result.error); return; }
    await fetchColaboradores();
    setModalOpen(false);
  }

  async function handleEdit(colaborador) {
    setEditing({ ...colaborador });
    setModalOpen(true);
  }

  async function handleUpdate(colaborador) {
    const res = await globalThis.fetch("/api/colaborador", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...colaborador, _id: editing._id }),
    });
    const result = await res.json();
    if (result.error) { globalThis.alert(result.error); return; }
    await fetchColaboradores();
    setEditing(null);
    setModalOpen(false);
  }

  function handleModalClose() {
    setEditing(null);
    setModalOpen(false);
  }

  function openDeleteModal(colaborador) {
    setDeleteTarget(colaborador);
    setConfirmCodigo("");
  }

  async function handleDeleteConfirm(e) {
    e.preventDefault();
    if (!isAdmin) return;
    if (confirmCodigo !== deleteTarget.codigo) return;
    setDeleteLoading(true);
    await globalThis.fetch(`/api/colaborador?id=${deleteTarget._id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setConfirmCodigo("");
    await fetchColaboradores();
    setDeleteLoading(false);
  }

  return (
    <Wrapper>
      <Title>Colaboradores</Title>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <FE.TopButton onClick={() => setModalOpen(true)}>Novo Colaborador</FE.TopButton>
        {colaboradores.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Pager page={page} pageSize={pageSize} total={colaboradores.length} onChangePage={setPage} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
              <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {colaboradores.length}</span>
            </div>
          </div>
        )}
      </div>
      {error && <Note $error>{error}</Note>}
      {loading ? <p>Carregando...</p> : (
        <Table>
          <thead>
            <tr>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('codigo')}>
                Código {sortKey === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('nome')}>
                Nome do Colaborador {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('empresa')}>
                Empresa {sortKey === 'empresa' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th>PIX</Th>
              <Th>Banco</Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('uf')}>
                UF {sortKey === 'uf' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('tipo')}>
                Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th>CNPJ/CPF</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {(
              () => {
                const list = Array.isArray(colaboradores) ? colaboradores.slice() : [];
                const getVal = (s) => {
                  switch (sortKey) {
                    case 'codigo': return String(s?.codigo ?? '').padStart(4, '0');
                    case 'nome': return String(s?.nome ?? '').toLowerCase();
                    case 'empresa': return String(s?.empresa ?? '').toLowerCase();
                    case 'uf': return String(s?.uf ?? '').toLowerCase();
                    case 'tipo': return String(s?.tipo ?? '').toLowerCase();
                    case 'createdAt': default: return s?.createdAt ? new Date(s.createdAt).getTime() : 0;
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
                const start = (page - 1) * pageSize;
                return list.slice(start, start + pageSize);
              }
            )().map(colaborador => (
              <tr key={colaborador._id}>
                <Td>{colaborador.codigo}</Td>
                <Td>
                  <button onClick={() => router.push(`/colaboradores/${colaborador._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                    {colaborador.nome}
                  </button>
                </Td>
                <Td>{colaborador.empresa || ''}</Td>
                <Td>{colaborador.pix}</Td>
                <Td>{colaborador.banco}</Td>
                <Td>{colaborador.uf}</Td>
                <Td>{colaborador.telefone}</Td>
                <Td>{colaborador.email}</Td>
                <Td>{colaborador.tipo}</Td>
                <Td>{colaborador.cnpjCpf}</Td>
                <Td>
                  <FE.SecondaryButton onClick={() => handleEdit(colaborador)}>Editar</FE.SecondaryButton>
                  {isAdmin && (
                    <FE.InlineButton onClick={() => openDeleteModal(colaborador)}>Excluir</FE.InlineButton>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {colaboradores.length > pageSize && (
        <Pager page={page} pageSize={pageSize} total={colaboradores.length} onChangePage={setPage} />
      )}
      <ColaboradorModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
      <DeleteModal
        action={deleteTarget ? { ...deleteTarget, entityType: "Colaborador" } : null}
        confirmName={confirmCodigo}
        setConfirmName={setConfirmCodigo}
        onCancel={() => { setDeleteTarget(null); setConfirmCodigo(""); }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        label="Digite o código do colaborador para confirmar a exclusão:"
      />
    </Wrapper>
  );
}

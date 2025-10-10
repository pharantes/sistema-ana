"use client";
/* eslint-env browser */
import styled from "styled-components";
import { useRouter } from 'next/navigation';
import Pager from "../components/ui/Pager";
import { SearchBar } from "../components/ui";
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
  font-size: 0.92rem;
  /* Allow wrapping to avoid horizontal scroll */
  table-layout: auto;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 6px;
  font-weight: 600;
  vertical-align: top;
`;
const Td = styled.td`
  padding: 6px;
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: anywhere;
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
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(q.trim().toLowerCase()), 250); return () => clearTimeout(t); }, [q]);
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
      <div style={{ display: 'grid', gap: 8, marginBottom: 4 }}>
        <div>
          <FE.TopButton onClick={() => setModalOpen(true)}>Novo Colaborador</FE.TopButton>
        </div>
        <div style={{ minWidth: 260 }}>
          <SearchBar value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="Buscar por nome, empresa, email, UF, telefone..." />
        </div>
      </div>
      {colaboradores.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'flex-end', marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
            <Pager page={page} pageSize={pageSize} total={colaboradores.length} onChangePage={setPage} compact inline />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}>
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
      {error && <Note $error>{error}</Note>}
      {loading ? <p>Carregando...</p> : (
        <Table>
          <thead>
            <tr>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('codigo')}>
                Código {sortKey === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('nome')}>
                Nome {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('tipo')}>
                Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('empresa')}>
                Empresa {sortKey === 'empresa' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th>CNPJ/CPF</Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('uf')}>
                UF {sortKey === 'uf' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th>Banco</Th>
              <Th>PIX</Th>
              <Th>Opções</Th>
            </tr>
          </thead>
          <tbody>
            {(
              () => {
                let list = Array.isArray(colaboradores) ? colaboradores.slice() : [];
                if (query) {
                  list = list.filter(s => {
                    const nome = String(s?.nome || '').toLowerCase();
                    const emp = String(s?.empresa || '').toLowerCase();
                    const email = String(s?.email || '').toLowerCase();
                    const uf = String(s?.uf || '').toLowerCase();
                    const tel = String(s?.telefone || '').toLowerCase();
                    return nome.includes(query) || emp.includes(query) || email.includes(query) || uf.includes(query) || tel.includes(query);
                  });
                }
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
                <Td style={{ whiteSpace: 'nowrap' }}>{colaborador.codigo}</Td>
                <Td style={{ minWidth: 140, textAlign: 'left' }}>
                  <button onClick={() => router.push(`/colaboradores/${colaborador._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>
                    {colaborador.nome}
                  </button>
                </Td>
                <Td style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{colaborador.tipo}</Td>
                <Td>{colaborador.empresa || ''}</Td>
                <Td style={{ whiteSpace: 'nowrap' }}>{colaborador.cnpjCpf}</Td>
                <Td style={{ whiteSpace: 'nowrap' }}>{colaborador.telefone}</Td>
                <Td style={{ maxWidth: 220 }}>{colaborador.email}</Td>
                <Td style={{ whiteSpace: 'nowrap' }}>{colaborador.uf}</Td>
                <Td style={{ maxWidth: 200 }}>{colaborador.banco}</Td>
                <Td style={{ maxWidth: 200 }}>{colaborador.pix}</Td>
                <Td>
                  <FE.ActionsRow>
                    <FE.SmallSecondaryButton onClick={() => handleEdit(colaborador)}>Editar</FE.SmallSecondaryButton>
                    {isAdmin && (
                      <FE.SmallInlineButton onClick={() => openDeleteModal(colaborador)}>Excluir</FE.SmallInlineButton>
                    )}
                  </FE.ActionsRow>
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

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
  padding: var(--page-padding);
`;

import { ThClickable, Th, Td, CompactTable } from "../components/ui/Table";
import LinkButton from '../components/ui/LinkButton';


// Local layout helpers
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
const GridWrap = styled.div`
  display: grid;
  gap: var(--gap-xs);
  margin-bottom: var(--space-xxs);
  .search-wrap { min-width: var(--search-min-width, 260px); }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--gap-sm);
  justify-content: flex-end;
  margin-bottom: var(--space-xs);
  flex-wrap: wrap;
  .info-row { display: inline-flex; align-items: baseline; gap: var(--gap-sm); }
  .label { font-size: 0.9rem; color: #555; }
`;

const TdLeft = styled(Td)`
  text-align: left;
`;
const TdCap = styled(Td)`
  text-transform: capitalize;
`;
const EmailTd = styled(Td)`
  max-width: 220px;
  /* prevent long emails from pushing into adjacent columns */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* ensure the inner content (links/buttons) respect truncation */
  a, span, div { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
const UFTd = styled(Td)`
  /* very small, fixed column for state (UF) to avoid overlap with email */
  width: 56px;
  max-width: 56px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const BankTd = styled(Td)`
  max-width: 200px;
`;
const OptionsTd = styled(Td)`
  max-width: 160px;
  /* Align the cell content vertically; don't force children width so buttons keep their natural size */
  display: flex;
  align-items: center;
  justify-content: flex-end; /* align buttons to right so they don't overflow the table edge */
  /* allow this flex table cell to shrink correctly and not force overflow */
  min-width: 0;
  /* hide the table divider just under the action buttons so they don't appear to have a line beneath */
  border-bottom: none !important;
  padding-right: var(--space-xs);
  /* ensure ActionsRow inside this cell keeps inline layout and gap consistent with other lists */
  ${FE.ActionsRow} {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-xs);
    min-width: 0;
  }
  /* ensure the small action buttons inside this cell use the same compact height as elsewhere */
  ${FE.SmallSecondaryButton}, ${FE.SmallInlineButton} {
    height: calc(var(--control-height, 36px) - var(--space-xs, 8px));
    padding: var(--space-xxs, 4px) var(--space-xs, 8px);
    font-size: var(--font-size-sm, 0.9rem);
    line-height: 1;
    box-sizing: border-box;
  }
  /* prevent accidental overflow from inner elements */
  overflow: hidden;
`;

// Helper to normalize collaborator type to PF / PJ
function tipoToShort(tipo) {
  if (!tipo && tipo !== 0) return '';
  const t = String(tipo).toLowerCase();
  if (t.includes('jurid') || t.includes('pj') || t.includes('pessoa juridica')) return 'PJ';
  if (t.includes('fisic') || t.includes('pf') || t.includes('pessoa fisica')) return 'PF';
  // fallback: return first two uppercase letters
  return String(tipo).slice(0, 2).toUpperCase();
}

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
      <GridWrap>
        <div>
          <FE.TopButton onClick={() => setModalOpen(true)}>Novo Colaborador</FE.TopButton>
        </div>
        <div className="search-wrap">
          <SearchBar value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="Buscar por nome, empresa, email, UF, telefone..." />
        </div>
      </GridWrap>
      {colaboradores.length > 0 && (
        <ControlsRow>
          <div>
            <Pager page={page} pageSize={pageSize} total={colaboradores.length} onChangePage={setPage} compact inline />
          </div>
          <div className="info-row">
            <span className="label">Mostrar:</span>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="label">Total: {colaboradores.length}</span>
          </div>
        </ControlsRow>
      )}
      {error && <Note $error>{error}</Note>}
      {loading ? <p>Carregando...</p> : (
        <CompactTable>
          <thead>
            <tr>
              <ThClickable onClick={() => toggleSort('codigo')}>
                Código {sortKey === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleSort('nome')}>
                Nome {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleSort('tipo')}>
                Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleSort('empresa')}>
                Empresa {sortKey === 'empresa' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <Th>CNPJ/CPF</Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <ThClickable onClick={() => toggleSort('uf')}>
                UF {sortKey === 'uf' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
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
                <Td>{colaborador.codigo}</Td>
                <TdLeft>
                  <LinkButton onClick={() => router.push(`/colaboradores/${colaborador._id}`)}>
                    {colaborador.nome}
                  </LinkButton>
                </TdLeft>
                <TdCap>{tipoToShort(colaborador.tipo)}</TdCap>
                <Td>{colaborador.empresa || ''}</Td>
                <Td>{colaborador.cnpjCpf}</Td>
                <Td>{colaborador.telefone}</Td>
                <EmailTd title={colaborador.email}>{colaborador.email}</EmailTd>
                <UFTd>{colaborador.uf}</UFTd>
                <BankTd>{colaborador.banco}</BankTd>
                <BankTd>{colaborador.pix}</BankTd>
                <OptionsTd>
                  <FE.ActionsRow>
                    <FE.SmallSecondaryButton onClick={() => handleEdit(colaborador)}>Editar</FE.SmallSecondaryButton>
                    {isAdmin && (
                      <FE.SmallInlineButton onClick={() => openDeleteModal(colaborador)}>Excluir</FE.SmallInlineButton>
                    )}
                  </FE.ActionsRow>
                </OptionsTd>
              </tr>
            ))}
          </tbody>
        </CompactTable>
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

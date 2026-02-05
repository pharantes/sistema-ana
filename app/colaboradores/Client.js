"use client";
/* eslint-env browser */
import styled from "styled-components";
import { useRouter } from 'next/navigation';
import Pager from "../components/ui/Pager";
import { SearchBar } from "../components/ui";
import DeleteModal from "../components/DeleteModal";
import ErrorModal from "../components/ErrorModal";
import { useEffect, useState, useCallback, useMemo } from "react";
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
  border-bottom: none !important;
  padding-right: var(--space-xs);
  vertical-align: middle !important;
`;

const PageSizeSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: none;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px;
  padding: 4px 28px 4px 8px;
  height: calc(var(--control-height, 32px) - 6px);
  font-size: var(--font-size-sm, 0.95rem);
  cursor: pointer;
  box-sizing: border-box;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px 12px;
`;

/**
 * Normalizes collaborator type to PF (Pessoa Física) or PJ (Pessoa Jurídica)
 */
function normalizeColaboradorTipo(tipo) {
  if (!tipo && tipo !== 0) return '';

  const normalizedTipo = String(tipo).toLowerCase();

  if (normalizedTipo.includes('jurid') || normalizedTipo.includes('pj') ||
    normalizedTipo.includes('pessoa juridica')) {
    return 'PJ';
  }

  if (normalizedTipo.includes('fisic') || normalizedTipo.includes('pf') ||
    normalizedTipo.includes('pessoa fisica')) {
    return 'PF';
  }

  // Fallback: return first two uppercase letters
  return String(tipo).slice(0, 2).toUpperCase();
}

/**
 * Sorts colaboradores by createdAt date in descending order
 */
function sortColaboradoresByNewest(colaboradores) {
  const colaboradoresList = Array.isArray(colaboradores) ? colaboradores.slice() : [];

  return colaboradoresList.sort((colaboradorA, colaboradorB) => {
    const dateA = colaboradorA?.createdAt ? new Date(colaboradorA.createdAt).getTime() : 0;
    const dateB = colaboradorB?.createdAt ? new Date(colaboradorB.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Fetches all colaboradores from the API
 */
async function fetchColaboradoresFromAPI() {
  const response = await globalThis.fetch("/api/colaborador");
  return await response.json();
}

/**
 * Custom hook for managing colaborador API operations
 */
function useColaboradorApi(initialColaboradores = []) {
  const [colaboradores, setColaboradores] = useState(
    Array.isArray(initialColaboradores) ? initialColaboradores : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchColaboradores = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchColaboradoresFromAPI();
      const sortedColaboradores = sortColaboradoresByNewest(data);
      setColaboradores(sortedColaboradores);
    } catch {
      setErrorMessage("Erro ao carregar colaboradores.");
    }
    setIsLoading(false);
  }, []);

  return {
    colaboradores,
    setColaboradores,
    fetchColaboradores,
    isLoading,
    errorMessage
  };
}

/**
 * Filters colaboradores based on search query
 */
function filterColaboradoresByQuery(colaboradores, searchQuery) {
  if (!searchQuery) return colaboradores;

  const normalizedQuery = searchQuery.toLowerCase();

  return colaboradores.filter(colaborador => {
    const nome = String(colaborador?.nome || '').toLowerCase();
    const empresa = String(colaborador?.empresa || '').toLowerCase();
    const email = String(colaborador?.email || '').toLowerCase();
    const uf = String(colaborador?.uf || '').toLowerCase();
    const telefone = String(colaborador?.telefone || '').toLowerCase();

    return nome.includes(normalizedQuery) ||
      empresa.includes(normalizedQuery) ||
      email.includes(normalizedQuery) ||
      uf.includes(normalizedQuery) ||
      telefone.includes(normalizedQuery);
  });
}

/**
 * Gets sort value for a colaborador based on sort key
 */
function getColaboradorSortValue(colaborador, sortKey) {
  switch (sortKey) {
    case 'codigo':
      return String(colaborador?.codigo ?? '').padStart(4, '0');
    case 'nome':
      return String(colaborador?.nome ?? '').toLowerCase();
    case 'empresa':
      return String(colaborador?.empresa ?? '').toLowerCase();
    case 'uf':
      return String(colaborador?.uf ?? '').toLowerCase();
    case 'tipo':
      return String(colaborador?.tipo ?? '').toLowerCase();
    case 'cnpjcpf':
      return String(colaborador?.cnpj || colaborador?.cpf || '').toLowerCase();
    case 'telefone':
      return String(colaborador?.telefone || '').toLowerCase();
    case 'email':
      return String(colaborador?.email || '').toLowerCase();
    case 'banco':
      return String(colaborador?.banco || '').toLowerCase();
    case 'pix':
      return String(colaborador?.pix || '').toLowerCase();
    case 'createdAt':
    default:
      return colaborador?.createdAt ? new Date(colaborador.createdAt).getTime() : 0;
  }
}

/**
 * Sorts colaboradores array by the specified key and direction
 */
function sortColaboradores(colaboradores, sortKey, sortDirection) {
  const colaboradoresList = colaboradores.slice();

  colaboradoresList.sort((colaboradorA, colaboradorB) => {
    const valueA = getColaboradorSortValue(colaboradorA, sortKey);
    const valueB = getColaboradorSortValue(colaboradorB, sortKey);

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const stringA = String(valueA || '');
    const stringB = String(valueB || '');
    const comparison = stringA.localeCompare(stringB);

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return colaboradoresList;
}

/**
 * Gets the default sort direction for a column
 */
function getDefaultSortDirection(sortKey) {
  return (sortKey === 'nome' || sortKey === 'empresa') ? 'asc' : 'desc';
}

/**
 * Creates a new colaborador via API
 */
async function createColaborador(colaboradorData) {
  const response = await globalThis.fetch("/api/colaborador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(colaboradorData),
  });
  return await response.json();
}

/**
 * Updates an existing colaborador via API
 */
async function updateColaborador(colaboradorData) {
  const response = await globalThis.fetch("/api/colaborador", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(colaboradorData),
  });
  return await response.json();
}

/**
 * Deletes a colaborador via API
 */
async function deleteColaborador(colaboradorId) {
  const response = await globalThis.fetch(`/api/colaborador?id=${colaboradorId}`, {
    method: "DELETE"
  });
  return response.ok;
}

/**
 * ColaboradoresClient - Client component for managing colaboradores
 */
export default function ColaboradoresClient({ initialColaboradores = [], isAdmin = false }) {
  const router = useRouter();
  const { colaboradores, fetchColaboradores, isLoading, errorMessage } = useColaboradorApi(initialColaboradores);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleToggleSort = (columnKey) => {
    if (sortKey === columnKey) {
      setSortDirection(currentDirection =>
        currentDirection === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortKey(columnKey);
      setSortDirection(getDefaultSortDirection(columnKey));
    }
  };

  // Refresh on mount if SSR data is empty (runs once)
  useEffect(() => {
    if (!Array.isArray(initialColaboradores) || initialColaboradores.length === 0) {
      fetchColaboradores();
    }
  }, []);

  async function handleCreate(colaborador) {
    const isSuccess = await createColaborador(colaborador);
    if (!isSuccess) {
      setErrorModal({ open: true, message: 'Erro ao criar colaborador. Verifique os dados e tente novamente.' });
      return;
    }
    await fetchColaboradores();
    setIsModalOpen(false);
  }

  async function handleEditClick(colaborador) {
    setEditingColaborador({ ...colaborador });
    setIsModalOpen(true);
  }

  async function handleUpdate(colaborador) {
    if (!editingColaborador?._id) return;

    const isSuccess = await updateColaborador(editingColaborador._id, colaborador);
    if (!isSuccess) {
      setErrorModal({ open: true, message: 'Erro ao atualizar colaborador. Verifique os dados e tente novamente.' });
      return;
    }
    await fetchColaboradores();
    setEditingColaborador(null);
    setIsModalOpen(false);
  }

  function handleModalClose() {
    setEditingColaborador(null);
    setIsModalOpen(false);
  }

  function openDeleteModal(colaborador) {
    setDeleteTarget(colaborador);
    setConfirmCodigo("");
  }

  async function handleDeleteConfirm(e) {
    e.preventDefault();
    if (!isAdmin) return;
    if (confirmCodigo !== deleteTarget.codigo) {
      setErrorModal({ open: true, message: 'O código digitado não corresponde ao código do colaborador.' });
      return;
    }

    setIsDeleteLoading(true);
    const isSuccess = await deleteColaborador(deleteTarget._id);

    if (isSuccess) {
      setDeleteTarget(null);
      setConfirmCodigo("");
      await fetchColaboradores();
    } else {
      setErrorModal({ open: true, message: 'Erro ao deletar colaborador.' });
    }

    setIsDeleteLoading(false);
  }

  // Compute paginated colaboradores list outside JSX to avoid conditional hook calls
  const paginatedColaboradores = useMemo(() => {
    // Filter by search query
    const filteredList = filterColaboradoresByQuery(colaboradores, searchQuery);

    // Sort the filtered list
    const sortedList = sortColaboradores(filteredList, sortKey, sortDirection);

    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    return sortedList.slice(startIndex, startIndex + pageSize);
  }, [colaboradores, searchQuery, sortKey, sortDirection, currentPage, pageSize]);

  return (
    <Wrapper>
      <Title>Colaboradores</Title>
      <GridWrap>
        <div>
          <FE.TopButton onClick={() => setIsModalOpen(true)}>Novo Colaborador</FE.TopButton>
        </div>
        <div className="search-wrap">
          <SearchBar
            value={searchInput}
            onChange={e => {
              setCurrentPage(1);
              setSearchInput(e.target.value);
            }}
            placeholder="Buscar por nome, empresa, email, UF, telefone..."
          />
        </div>
      </GridWrap>
      {colaboradores.length > 0 && (
        <ControlsRow>
          <div>
            <Pager
              page={currentPage}
              pageSize={pageSize}
              total={colaboradores.length}
              onChangePage={setCurrentPage}
              compact
              inline
            />
          </div>
          <div className="info-row">
            <span className="label">Mostrar:</span>
            <PageSizeSelect value={pageSize} onChange={(e) => {
              setCurrentPage(1);
              setPageSize(Number(e.target.value));
            }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </PageSizeSelect>
            <span className="label">Total: {colaboradores.length}</span>
          </div>
        </ControlsRow>
      )}
      {errorMessage && <Note $error>{errorMessage}</Note>}
      {isLoading ? <p>Carregando...</p> : (
        <CompactTable>
          <thead>
            <tr>
              <ThClickable onClick={() => handleToggleSort('codigo')}>
                Código {sortKey === 'codigo' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('nome')}>
                Nome {sortKey === 'nome' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('tipo')}>
                Tipo {sortKey === 'tipo' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('empresa')}>
                Empresa {sortKey === 'empresa' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('cnpjcpf')}>
                CNPJ/CPF {sortKey === 'cnpjcpf' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('telefone')}>
                Telefone {sortKey === 'telefone' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('email')}>
                Email {sortKey === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('uf')}>
                UF {sortKey === 'uf' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('banco')}>
                Banco {sortKey === 'banco' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => handleToggleSort('pix')}>
                PIX {sortKey === 'pix' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <Th>Opções</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedColaboradores.map(colaborador => (
              <tr key={colaborador._id}>
                <Td>{colaborador.codigo}</Td>
                <TdLeft>
                  <LinkButton onClick={() => router.push(`/colaboradores/${colaborador._id}`)}>
                    {colaborador.nome}
                  </LinkButton>
                </TdLeft>
                <TdCap>{normalizeColaboradorTipo(colaborador.tipo)}</TdCap>
                <Td>{colaborador.empresa || ''}</Td>
                <Td>{colaborador.cnpjCpf}</Td>
                <Td>{colaborador.telefone}</Td>
                <EmailTd title={colaborador.email}>{colaborador.email}</EmailTd>
                <UFTd>{colaborador.uf}</UFTd>
                <BankTd>{colaborador.banco}</BankTd>
                <BankTd>{colaborador.pix}</BankTd>
                <OptionsTd>
                  <FE.ActionsRow>
                    <FE.SmallSecondaryButton onClick={() => handleEditClick(colaborador)}>Editar</FE.SmallSecondaryButton>
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
        <Pager
          page={currentPage}
          pageSize={pageSize}
          total={colaboradores.length}
          onChangePage={setCurrentPage}
        />
      )}
      <ColaboradorModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={editingColaborador ? handleUpdate : handleCreate}
        initial={editingColaborador}
      />
      <DeleteModal
        action={deleteTarget ? { ...deleteTarget, entityType: "Colaborador" } : null}
        confirmName={confirmCodigo}
        setConfirmName={setConfirmCodigo}
        onCancel={() => { setDeleteTarget(null); setConfirmCodigo(""); }}
        onConfirm={handleDeleteConfirm}
        loading={isDeleteLoading}
        label="Digite o código do colaborador para confirmar a exclusão:"
      />
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        message={errorModal.message}
      />
    </Wrapper>
  );
}

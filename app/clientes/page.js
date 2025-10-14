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

const Wrapper = styled.div` padding: var(--page-padding); `;
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;

/**
 * Fetches all clientes from the API
 */
async function fetchClientesFromAPI() {
  const response = await globalThis.fetch("/api/cliente");
  return await response.json();
}

/**
 * Sorts clientes by createdAt date in descending order
 */
function sortClientesByNewest(clientes) {
  const clientesList = Array.isArray(clientes) ? clientes.slice() : [];

  return clientesList.sort((clienteA, clienteB) => {
    const dateA = clienteA?.createdAt ? new Date(clienteA.createdAt).getTime() : 0;
    const dateB = clienteB?.createdAt ? new Date(clienteB.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Filters clientes based on search query
 */
function filterClientesByQuery(clientes, searchQuery) {
  if (!searchQuery) return clientes;

  const normalizedQuery = searchQuery.toLowerCase();

  return clientes.filter(cliente => {
    const nome = String(cliente?.nome || '').toLowerCase();
    const contato = String(cliente?.nomeContato || '').toLowerCase();
    const email = String(cliente?.email || '').toLowerCase();
    const cidade = String(cliente?.cidade || '').toLowerCase();

    return nome.includes(normalizedQuery) ||
      contato.includes(normalizedQuery) ||
      email.includes(normalizedQuery) ||
      cidade.includes(normalizedQuery);
  });
}

/**
 * Gets sort value for a cliente based on sort key
 */
function getClienteSortValue(cliente, sortKey) {
  switch (sortKey) {
    case 'codigo':
      return String(cliente?.codigo ?? '').padStart(4, '0');
    case 'nome':
      return String(cliente?.nome ?? '').toLowerCase();
    case 'endereco':
      return String(cliente?.endereco ?? '').toLowerCase();
    case 'cidade':
      return String(cliente?.cidade ?? '').toLowerCase();
    case 'uf':
      return String(cliente?.uf ?? '').toLowerCase();
    case 'telefone':
      return String(cliente?.telefone ?? '').toLowerCase();
    case 'email':
      return String(cliente?.email ?? '').toLowerCase();
    case 'contato':
      return String(cliente?.nomeContato ?? '').toLowerCase();
    case 'tipo':
      return String(cliente?.tipo ?? '').toLowerCase();
    case 'cnpjcpf':
      return String(cliente?.cnpjCpf ?? '').toLowerCase();
    case 'createdAt':
    default:
      return cliente?.createdAt ? new Date(cliente.createdAt).getTime() : 0;
  }
}

/**
 * Sorts clientes array by the specified key and direction
 */
function sortClientes(clientes, sortKey, sortDirection) {
  const clientesList = clientes.slice();

  clientesList.sort((clienteA, clienteB) => {
    const valueA = getClienteSortValue(clienteA, sortKey);
    const valueB = getClienteSortValue(clienteB, sortKey);

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const stringA = String(valueA || '');
    const stringB = String(valueB || '');
    const comparison = stringA.localeCompare(stringB);

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return clientesList;
}

/**
 * Gets the default sort direction for a column
 */
function getDefaultSortDirection(sortKey) {
  return (sortKey === 'nome' || sortKey === 'cidade') ? 'asc' : 'desc';
}

/**
 * Creates a new cliente via API
 */
async function createCliente(clienteData) {
  await globalThis.fetch("/api/cliente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clienteData),
  });
}

/**
 * Updates an existing cliente via API
 */
async function updateCliente(clienteData) {
  await globalThis.fetch("/api/cliente", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clienteData),
  });
}

/**
 * Deletes a cliente via API
 */
async function deleteCliente(clienteId) {
  await globalThis.fetch("/api/cliente", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: clienteId }),
  });
}

/**
 * Validates if the confirmation codigo matches the target cliente codigo
 */
function validateCodigoMatch(confirmCodigo, targetCodigo) {
  const paddedInput = String(confirmCodigo).padStart(4, "0");
  const paddedTarget = String(targetCodigo).padStart(4, "0");
  return paddedInput === paddedTarget;
}

/**
 * ClientesPage - Main page for managing clientes
 */
export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    setIsLoading(true);
    const clientesData = await fetchClientesFromAPI();
    const sortedClientes = sortClientesByNewest(clientesData);
    setClientes(sortedClientes);
    setIsLoading(false);
  }

  const totalClientes = clientes?.length || 0;

  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

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

  const sortedAndFilteredClientes = useMemo(() => {
    const filtered = filterClientesByQuery(clientes, searchQuery);
    return sortClientes(filtered, sortKey, sortDirection);
  }, [clientes, searchQuery, sortKey, sortDirection]);

  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredClientes.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredClientes, currentPage, pageSize]);

  async function handleCreateCliente(clienteData) {
    setIsLoading(true);
    await createCliente(clienteData);
    await loadClientes();
    setIsModalOpen(false);
    setIsLoading(false);
  }

  function handleEditCliente(cliente) {
    setEditingCliente({ ...cliente });
    setIsModalOpen(true);
  }

  async function handleUpdateCliente(clienteData) {
    setIsLoading(true);
    await updateCliente({ ...clienteData, _id: editingCliente._id });
    await loadClientes();
    setEditingCliente(null);
    setIsModalOpen(false);
    setIsLoading(false);
  }

  function openDeleteModal(cliente) {
    setDeleteTarget(cliente);
    setConfirmCodigo("");
    setIsDeleteModalOpen(true);
  }

  async function handleConfirmDelete(event) {
    event.preventDefault();

    if (!validateCodigoMatch(confirmCodigo, deleteTarget.codigo)) {
      return;
    }

    setIsDeleteLoading(true);
    await deleteCliente(deleteTarget._id);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setConfirmCodigo("");
    await loadClientes();
    setIsDeleteLoading(false);
  }

  function handleCloseModal() {
    setEditingCliente(null);
    setIsModalOpen(false);
  }

  function handleSearchChange(event) {
    setCurrentPage(1);
    setSearchInput(event.target.value);
  }

  // TODO: Replace with actual session.user.role === "admin" check
  const isAdmin = true;

  return (
    <Wrapper>
      <Title>Clientes</Title>
      <RowWrap>
        <FE.TopButton onClick={() => setIsModalOpen(true)}>
          Novo Cliente
        </FE.TopButton>
        <SearchBar
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar por nome, contato, email ou cidade..."
        />
      </RowWrap>
      {isLoading ? <p>Carregando...</p> : (
        <ClientesTableWithFooter
          rows={paginatedClientes}
          page={currentPage}
          pageSize={pageSize}
          total={totalClientes}
          onChangePage={setCurrentPage}
          onChangePageSize={setPageSize}
          sortKey={sortKey}
          sortDir={sortDirection}
          onToggleSort={handleToggleSort}
          onEdit={handleEditCliente}
          onDelete={openDeleteModal}
          onOpenDetails={(cliente) => router.push(`/clientes/${cliente._id}`)}
          canDelete={isAdmin}
        />
      )}
      <ClienteModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingCliente ? handleUpdateCliente : handleCreateCliente}
        initial={editingCliente}
      />
      {isDeleteModalOpen && (
        <DeleteModal
          action={deleteTarget ? { ...deleteTarget, entityType: "Cliente" } : null}
          confirmName={confirmCodigo}
          setConfirmName={setConfirmCodigo}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            setConfirmCodigo("");
          }}
          onConfirm={handleConfirmDelete}
          loading={isDeleteLoading}
          label="Digite o código do cliente para confirmar a exclusão:"
        />
      )}
    </Wrapper>
  );
}

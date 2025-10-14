"use client";
/* eslint-env browser */
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Filters from "./Filters";
import ContasReceberModal from "./ContasReceberModal";
import AcoesTable from "./components/AcoesTable";
import { gerarContasAReceberPDF } from "./utils/pdf";
// Pager now centralized in components/ui/Pager

const Wrapper = styled.div`
  padding: var(--page-padding);
`;
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
// Table, Th, Td imported from components/ui/Table for consistency

/**
 * Builds API URL with query parameters for contas a receber
 * @param {Object} filters - Filter parameters
 * @returns {URL} Constructed API URL
 */
function buildContasReceberURL(filters) {
  const apiUrl = new URL('/api/contasareceber', globalThis.location.origin);

  if (filters.query) {
    apiUrl.searchParams.set('q', filters.query);
  }

  if (filters.mode === 'venc') {
    if (filters.dateFrom) apiUrl.searchParams.set('vencFrom', filters.dateFrom);
    if (filters.dateTo) apiUrl.searchParams.set('vencTo', filters.dateTo);
  } else {
    if (filters.dateFrom) apiUrl.searchParams.set('recFrom', filters.dateFrom);
    if (filters.dateTo) apiUrl.searchParams.set('recTo', filters.dateTo);
  }

  if (filters.statusFilter && filters.statusFilter !== 'ALL') {
    apiUrl.searchParams.set('status', filters.statusFilter);
  }

  apiUrl.searchParams.set('sort', filters.sortKey);
  apiUrl.searchParams.set('dir', filters.sortDir);
  apiUrl.searchParams.set('page', String(filters.page));
  apiUrl.searchParams.set('pageSize', String(filters.pageSize));

  return apiUrl;
}

/**
 * Fetches contas a receber from API
 * @param {Object} filters - Filter parameters
 * @returns {Promise<{items: Array, total: number}>} Items and total count
 */
async function fetchContasReceber(filters) {
  try {
    const apiUrl = buildContasReceberURL(filters);
    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

    const total = Number.isFinite(data?.total)
      ? data.total
      : Array.isArray(data)
        ? data.length
        : 0;

    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}

/**
 * Updates receivable status via API
 * @param {Object} row - Row data
 * @param {string} newStatus - New status value
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
async function updateReceivableStatus(row, newStatus) {
  const receivable = row.receivable || {};
  const payload = {
    id: receivable?._id,
    actionId: row._id,
    clientId: row.clientId,
    status: newStatus
  };

  const response = await fetch('/api/contasareceber', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Falha ao atualizar status');
  }
}

/**
 * Contas a receber page with filters and table
 */
export default function ContasAReceberPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState('date'); // 'date' | 'acao' | 'cliente' | 'venc' | 'receb'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [mode, setMode] = useState('venc'); // 'venc' | 'receb'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ABERTO | RECEBIDO
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);

  // Server-driven fetch on dependency changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const filters = {
        query,
        mode,
        dateFrom,
        dateTo,
        statusFilter,
        sortKey,
        sortDir,
        page,
        pageSize
      };
      const { items: fetchedItems, total: fetchedTotal } = await fetchContasReceber(filters);
      setItems(fetchedItems);
      setTotal(fetchedTotal);
      setLoading(false);
    }
    loadData();
  }, [query, sortKey, sortDir, mode, dateFrom, dateTo, statusFilter, page, pageSize, version]);

  async function gerarPDF() {
    // Fetch all items with current filters to generate complete report
    const filters = {
      query,
      mode,
      dateFrom,
      dateTo,
      statusFilter,
      sortKey,
      sortDir,
      page: 1,
      pageSize: 10000
    };
    const { items: allItems } = await fetchContasReceber(filters);
    await gerarContasAReceberPDF(allItems);
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'acao' || key === 'cliente' ? 'asc' : 'desc'); setPage(1); }
  };
  const clearFilters = () => { setQuery(''); setMode('venc'); setDateFrom(''); setDateTo(''); setStatusFilter('ALL'); };

  if (status === "loading") return <div>Loading...</div>;
  if (!session || session.user.role !== "admin") {
    return <Wrapper><Title>Acesso restrito</Title><p>Somente administradores podem acessar esta página.</p></Wrapper>;
  }
  return (
    <Wrapper>
      <Title>Contas a Receber</Title>
      <Filters
        query={query}
        onChangeQuery={setQuery}
        onGerarPDF={gerarPDF}
        loading={loading}
        mode={mode}
        onChangeMode={setMode}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChangeDateFrom={setDateFrom}
        onChangeDateTo={setDateTo}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        onClear={clearFilters}
      />
      <AcoesTable
        rows={items}
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={setPage}
        onChangePageSize={setPageSize}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onChangeStatus={async (row, newStatus, options) => {
          if (options?.openModal) {
            setSelectedAction(row);
            setModalOpen(true);
            return;
          }

          const originalReceivable = row.receivable || {};
          const originalStatus = originalReceivable?.status || 'ABERTO';

          // Optimistic UI update
          setItems(prevItems =>
            prevItems.map(item =>
              item._id === row._id
                ? { ...item, receivable: { ...(item.receivable || {}), status: newStatus } }
                : item
            )
          );

          try {
            await updateReceivableStatus(row, newStatus);
          } catch (error) {
            alert(error.message || 'Erro ao atualizar status');
            // Revert on error
            setItems(prevItems =>
              prevItems.map(item =>
                item._id === row._id
                  ? { ...item, receivable: { ...(item.receivable || {}), status: originalStatus } }
                  : item
              )
            );
          }
        }}
      />
      <ContasReceberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        action={selectedAction}
        receivable={selectedAction?.receivable || null}
        clienteDetails={selectedAction?.clienteDetails || null}
        onSaved={() => { setModalOpen(false); setVersion(v => v + 1); }}
      />
    </Wrapper>
  );
}


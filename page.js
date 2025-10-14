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
    async function load() {
      setLoading(true);
      try {
        const apiUrl = new URL('/api/contasareceber', globalThis.location.origin);
        if (query) apiUrl.searchParams.set('q', query);
        if (mode === 'venc') {
          if (dateFrom) apiUrl.searchParams.set('vencFrom', dateFrom);
          if (dateTo) apiUrl.searchParams.set('vencTo', dateTo);
        } else {
          if (dateFrom) apiUrl.searchParams.set('recFrom', dateFrom);
          if (dateTo) apiUrl.searchParams.set('recTo', dateTo);
        }
        if (statusFilter && statusFilter !== 'ALL') apiUrl.searchParams.set('status', statusFilter);
        apiUrl.searchParams.set('sort', sortKey);
        apiUrl.searchParams.set('dir', sortDir);
        apiUrl.searchParams.set('page', String(page));
        apiUrl.searchParams.set('pageSize', String(pageSize));
        const res = await fetch(apiUrl.toString());
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        setTotal(Number.isFinite(data?.total) ? data.total : (Array.isArray(data) ? data.length : 0));
      } catch {
        setItems([]); setTotal(0);
      }
      setLoading(false);
    }
    load();
  }, [query, sortKey, sortDir, mode, dateFrom, dateTo, statusFilter, page, pageSize, version]);
  // totalPages not needed here since Pager computes it internally

  async function gerarPDF() {
    // Busca todos os itens com os filtros atuais para gerar o relatório completo
    const apiUrl = new URL('/api/contasareceber', globalThis.location.origin);
    if (query) apiUrl.searchParams.set('q', query);
    if (mode === 'venc') {
      if (dateFrom) apiUrl.searchParams.set('vencFrom', dateFrom);
      if (dateTo) apiUrl.searchParams.set('vencTo', dateTo);
    } else {
      if (dateFrom) apiUrl.searchParams.set('recFrom', dateFrom);
      if (dateTo) apiUrl.searchParams.set('recTo', dateTo);
    }
    if (statusFilter && statusFilter !== 'ALL') apiUrl.searchParams.set('status', statusFilter);
    apiUrl.searchParams.set('sort', sortKey);
    apiUrl.searchParams.set('dir', sortDir);
    apiUrl.searchParams.set('page', '1');
    apiUrl.searchParams.set('pageSize', '10000');
    const resAll = await fetch(apiUrl.toString());
    const dataAll = await resAll.json();
    const rows = Array.isArray(dataAll?.items) ? dataAll.items : (Array.isArray(dataAll) ? dataAll : []);
    await gerarContasAReceberPDF(rows);
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
        onChangeStatus={async (row, next, opts) => {
          if (opts?.openModal) {
            setSelectedAction(row);
            setModalOpen(true);
            return;
          }
          const r = row.receivable || {};
          // optimistic UI
          setItems(prev => prev.map(it => it._id === row._id ? { ...it, receivable: { ...(it.receivable || {}), status: next } } : it));
          try {
            const payload = { id: r?._id, actionId: row._id, clientId: row.clientId, status: next };
            const res = await fetch('/api/contasareceber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Falha ao atualizar status');
          } catch (err) {
            alert(err.message || 'Erro ao atualizar status');
            // revert on error
            setItems(prev => prev.map(it => it._id === row._id ? { ...it, receivable: { ...(it.receivable || {}), status: (r?.status || 'ABERTO') } } : it));
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


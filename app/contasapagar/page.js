"use client";
/* eslint-env browser */
import styled from "styled-components";
import { Note as SmallNote, InputWrap, RowWrap, RowEnd, RowTopGap, RowInline } from '../components/ui/primitives';
import Filters from "./Filters";
import ContasFixasTable from "./components/ContasFixasTable";

// Pager now centralized in components/ui/Pager


const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
const Wrapper = styled.div`
  padding: 0;
`;
const PageSection = styled.div`
  margin-top: var(--space-sm);
`;
// use shared RowEnd primitive from ui/primitives
const SearchRow = styled(RowWrap)`
  justify-content: space-between;
  gap: var(--gap-sm);
  align-items: end;
  flex-wrap: wrap;
  margin-top: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const SearchCol = styled.div`
  display:flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: var(--min-col-width, 280px);
  flex: 1 1 320px;
`;
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display:flex; align-items:center; justify-content:center; z-index:50;
`;
const ModalCard = styled.div`
  background: #fff; padding: var(--space-md, var(--space-md, 16px)); border-radius: var(--radius-md); width: var(--modal-min-width, 420px); max-width: 90%;
`;
const ModalGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: var(--gap-xs); margin-top: var(--space-xs);
`;
const ModalField = styled(InputWrap)`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const H2 = styled.h2`
  margin-top: var(--space-sm);
`;
const H2Large = styled.h2`
  margin-top: var(--space-lg);
`;
// compact container for small buttons removed — use shared RowInline directly
const SmallSecondaryButton = styled(FE.SecondaryButton)`
  height: var(--control-height, 36px);
`;
// SmallNote and PresetButton imported from primitives
// TopGap removed — use RowInline with margin when needed

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useRef } from "react";
import * as FE from "../components/FormElements";
import { formatBRL, parseCurrency } from "../utils/currency";
import { formatDateBR } from "@/lib/utils/dates";
import BRDateInput from "../components/BRDateInput";
import BRCurrencyInput from "../components/BRCurrencyInput";
import AcoesTable from "./components/AcoesTable";
import { gerarPDFAcoes as gerarPDFAcoesUtil, gerarContasAPagarPDF } from "./utils/pdf";

// Date preset UI moved to Filters component

// Table, Th, Td now imported from components/ui/Table

export default function ContasAPagarPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [pageSizeAcoes, setPageSizeAcoes] = useState(10);
  const [pageAcoes, setPageAcoes] = useState(1);
  const [query, setQuery] = useState("");
  // Use dueFrom/dueTo to reflect dueDate semantics (UI label remains "Vencimento")
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ABERTO | PAGO
  const [fixas, setFixas] = useState([]);
  const [pageSizeFixas, setPageSizeFixas] = useState(10);
  const [pageFixas, setPageFixas] = useState(1);
  const [sortKeyFixas, setSortKeyFixas] = useState('vencimento'); // 'nome' | 'empresa' | 'tipo' | 'valor' | 'vencimento' | 'status'
  const [sortDirFixas, setSortDirFixas] = useState('asc'); // 'asc' | 'desc'
  const [showFixaModal, setShowFixaModal] = useState(false);
  const [fixaForm, setFixaForm] = useState({ name: '', empresa: '', tipo: 'mensal', valor: '', status: 'ABERTO', vencimento: '' });
  const [fixaEditing, setFixaEditing] = useState(null);
  const inputRef = useRef(null);
  const inputSx = { height: 36 };

  useEffect(() => {
    try { inputRef.current?.focus(); } catch { /* noop */ }
  }, []);

  // Date preset helpers now encapsulated in Filters
  const clearAll = () => {
    setQuery(""); setDueFrom(""); setDueTo(""); setStatusFilter('ALL');
    try { inputRef.current?.focus(); } catch { /* noop */ }
  };

  async function fetchReports() {
    // optional loading state removed to avoid unused vars
    try {
      const params = new globalThis.URLSearchParams();
      if (dueFrom) params.set('vencFrom', dueFrom);
      if (dueTo) params.set('vencTo', dueTo);
      const url = "/api/contasapagar" + (params.toString() ? `?${params.toString()}` : "");
      const res = await globalThis.fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao carregar contas a pagar");
      }
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      globalThis.alert(e.message || "Falha ao carregar contas a pagar");
      setReports([]);
    }
    // no-op
  }

  // currency formatting now imported from utils

  // refetch when date range changes (vencimento/dueDate based)
  useEffect(() => {
    fetchReports();
  }, [dueFrom, dueTo]);

  // initial load
  useEffect(() => { fetchReports(); }, []);
  useEffect(() => { fetchFixas(); }, []);

  // Removed delete functionality per new requirements

  async function handleStatusChange(id, next, current) {
    if (!session || session.user.role !== "admin") return;
    // Optimistically set to selected value
    setReports(prev => prev.map(r => (r._id === id ? { ...r, status: next } : r)));
    try {
      const res = await globalThis.fetch("/api/contasapagar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: next })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao atualizar status");
      }
      const updated = await res.json();
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: updated.status } : r)));
    } catch (e) {
      globalThis.alert(e.message || "Erro ao atualizar status");
      // revert on error
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: current } : r)));
    }
  }

  // Fixed bills helpers
  // Use shared utils/formatDateBR imported at top
  const getCycleDays = (tipo) => (String(tipo) === 'quizenal' ? 15 : 30);
  const getNextDueDate = (c) => {
    const base = c?.lastPaidAt ? new Date(c.lastPaidAt) : (c?.createdAt ? new Date(c.createdAt) : null);
    if (!base) return null;
    const days = getCycleDays(c?.tipo);
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };
  const getDisplayStatus = (c) => {
    const raw = String(c?.status || 'ABERTO').toUpperCase();
    if (raw !== 'PAGO') return 'ABERTO';
    const due = getNextDueDate(c);
    if (!due) return 'ABERTO';
    return (new Date() < due) ? 'PAGO' : 'ABERTO';
  };

  async function handleFixaStatusChange(c, nextVal) {
    const next = String(nextVal || '').toUpperCase();
    // optimistic update
    setFixas(prev => prev.map(x => x._id === c._id ? { ...x, status: next, lastPaidAt: (next === 'PAGO' ? new Date().toISOString() : undefined) } : x));
    try {
      const patch = { id: c._id, status: next };
      if (next === 'PAGO') patch.lastPaidAt = new Date().toISOString(); else patch.lastPaidAt = null;
      const res = await globalThis.fetch('/api/contafixa', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      const updated = await res.json();
      setFixas(prev => prev.map(x => x._id === c._id ? updated : x));
    } catch (e) {
      globalThis.alert(e.message || 'Erro ao atualizar status');
      // revert
      fetchFixas();
    }
  }

  // Sorting state for Custos ações
  const [sortKeyAcoes, setSortKeyAcoes] = useState('created'); // 'created' | 'acao' | 'colaborador' | 'due'
  const [sortDirAcoes, setSortDirAcoes] = useState('desc'); // 'asc' | 'desc'

  // Robust date parser to handle ISO, YYYY-MM-DD, and DD/MM/YYYY strings
  const dateToTime = (val) => {
    if (!val) return 0;
    try {
      if (val instanceof Date && !isNaN(val)) return val.getTime();
      const s = String(val);
      // ISO or YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s);
        return isNaN(d) ? 0 : d.getTime();
      }
      // DD/MM/YYYY
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        return isNaN(d) ? 0 : d.getTime();
      }
      const d = new Date(s);
      return isNaN(d) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  // Helper to derive the row due date (vencimento) from staff or cost
  const getRowDueDate = (r) => {
    if (!r || !r.actionId) return null;
    const staff = Array.isArray(r.actionId?.staff) ? r.actionId.staff : [];
    const costs = Array.isArray(r.actionId?.costs) ? r.actionId.costs : [];
    const st = r.staffName ? staff.find(s => s.name === r.staffName) : null;
    const ct = (!r.staffName && r.costId) ? costs.find(c => String(c._id) === String(r.costId)) : null;
    return st?.vencimento || ct?.vencimento || null;
  };

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const base = Array.isArray(reports) ? reports : [];
    let out = q
      ? base.filter(r => {
        const cliente = String(r?.actionId?.client || "").toLowerCase();
        const acao = String(r?.actionId?.name || "").toLowerCase();
        let serv = String(r?.staffName || "").toLowerCase();
        // If it's a cost row, search by description too
        if (!r?.staffName && r?.costId && Array.isArray(r?.actionId?.costs)) {
          const ct = r.actionId.costs.find(c => String(c._id) === String(r.costId));
          if (ct && ct.description) serv = String(ct.description).toLowerCase();
        }
        return cliente.includes(q) || acao.includes(q) || serv.includes(q);
      })
      : base.slice();
    // apply status filter when selected
    if (statusFilter === 'ABERTO' || statusFilter === 'PAGO') {
      out = out.filter(r => (String(r?.status || 'ABERTO').toUpperCase() === statusFilter));
    }
    // sort by selected column
    const getVal = (r, key) => {
      if (!r) return null;
      if (key === 'created') {
        const base = r?.actionId?.date || r?.reportDate || null;
        return dateToTime(base);
      }
      if (key === 'acao') {
        return String(r?.actionId?.name || r?.actionId?.event || '').toLowerCase();
      }
      if (key === 'colaborador') {
        if (r?.staffName) return String(r?.colaboradorLabel || r?.staffName || '').toLowerCase();
        if (r?.costId) return String(r?.colaboradorLabel || '').toLowerCase();
        return '';
      }
      if (key === 'due') {
        const d = getRowDueDate(r);
        return dateToTime(d);
      }
      return '';
    };
    // sort a shallow copy to avoid mutating state
    out = out.slice();
    out.sort((a, b) => {
      const va = getVal(a, sortKeyAcoes);
      const vb = getVal(b, sortKeyAcoes);
      if (typeof va === 'number' && typeof vb === 'number') return sortDirAcoes === 'asc' ? va - vb : vb - va;
      const sa = String(va || '');
      const sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      if (cmp === 0) {
        // tie-break by created to keep stable order
        const ta = dateToTime(a?.actionId?.date || a?.reportDate);
        const tb = dateToTime(b?.actionId?.date || b?.reportDate);
        return sortDirAcoes === 'asc' ? ta - tb : tb - ta;
      }
      return sortDirAcoes === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [reports, query, statusFilter, sortKeyAcoes, sortDirAcoes]);

  const toggleSortAcoes = (key) => {
    if (sortKeyAcoes === key) setSortDirAcoes(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKeyAcoes(key); setSortDirAcoes((key === 'acao' || key === 'colaborador') ? 'asc' : 'desc'); }
  };
  const totalAcoes = filtered.length;
  // totalPagesAcoes computed internally by Pager; local variable no longer needed
  const pageDataAcoes = useMemo(() => {
    const start = (pageAcoes - 1) * pageSizeAcoes;
    return filtered.slice(start, start + pageSizeAcoes);
  }, [filtered, pageAcoes, pageSizeAcoes]);

  // Generate PDF for Custos ações only via utils
  async function onGerarPDFAcoes() {
    if (!filtered.length) {
      globalThis.alert("Nenhum resultado para gerar o relatório");
      return;
    }
    await gerarPDFAcoesUtil(filtered);
  }

  // Contas Fixas filtered by date presets and status presets (not by text search)
  const filteredFixas = useMemo(() => {
    let out = Array.isArray(fixas) ? fixas.slice() : [];
    // Date filter on vencimento
    const from = dueFrom ? new Date(`${dueFrom}T00:00:00`) : null;
    const to = dueTo ? new Date(`${dueTo}T23:59:59`) : null;
    if (from || to) {
      out = out.filter(c => {
        if (!c?.vencimento) return false;
        const d = new Date(c.vencimento);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // Status preset using display status
    if (statusFilter === 'ABERTO' || statusFilter === 'PAGO') {
      out = out.filter(c => getDisplayStatus(c) === statusFilter);
    }
    return out;
  }, [fixas, dueFrom, dueTo, statusFilter]);
  const sortedFixas = useMemo(() => {
    const list = filteredFixas.slice();
    const getVal = (c) => {
      switch (sortKeyFixas) {
        case 'nome': return String(c?.name || '').toLowerCase();
        case 'empresa': return String(c?.empresa || '').toLowerCase();
        case 'tipo': return String(c?.tipo || '').toLowerCase();
        case 'valor': return Number(c?.valor || 0);
        case 'status': return String(getDisplayStatus(c) || '').toLowerCase();
        case 'vencimento':
        default:
          return dateToTime(c?.vencimento);
      }
    };
    list.sort((a, b) => {
      const va = getVal(a); const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return sortDirFixas === 'asc' ? va - vb : vb - va;
      const sa = String(va || ''); const sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return sortDirFixas === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredFixas, sortKeyFixas, sortDirFixas]);
  // const totalFixas = sortedFixas.length; // no longer used at page level
  // Pagination for fixas is handled within ContasFixasTable; no local page slices needed here
  const toggleSortFixas = (key) => {
    if (sortKeyFixas === key) setSortDirFixas(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKeyFixas(key); setSortDirFixas('asc'); setPageFixas(1); }
  };

  // Removed combined PDF handler by request
  // Only fixas PDF
  async function onGerarPDFFixas() {
    await gerarContasAPagarPDF({
      rows: [],
      fixasRows: filteredFixas,
      dueFrom,
      dueTo,
      includeFixas: true,
      getDisplayStatus,
    });
  }

  // Contas fixas CRUD helpers
  async function fetchFixas() {
    try {
      const res = await globalThis.fetch('/api/contafixa');
      if (!res.ok) throw new Error('Falha ao carregar contas fixas');
      const data = await res.json();
      setFixas(Array.isArray(data) ? data : []);
    } catch {
      setFixas([]);
    }
  }

  function openNewFixa() {
    setFixaEditing(null);
    setFixaForm({ name: '', empresa: '', tipo: 'mensal', valor: '', status: 'ABERTO', vencimento: '' });
    setShowFixaModal(true);
  }

  function openEditFixa(c) {
    setFixaEditing(c);
    setFixaForm({
      name: c.name || '',
      empresa: c.empresa || '',
      tipo: c.tipo || 'mensal',
      valor: c.valor != null ? formatBRL(Number(c.valor)) : '',
      status: (c.status || 'ABERTO').toUpperCase(),
      vencimento: c.vencimento ? new Date(c.vencimento).toISOString().slice(0, 10) : ''
    });
    setShowFixaModal(true);
  }

  async function saveFixa() {
    const parsedValor = parseCurrency(fixaForm.valor);
    const payload = {
      name: (fixaForm.name || '').trim(),
      empresa: (fixaForm.empresa || '').trim(),
      tipo: (fixaForm.tipo || '').trim(),
      valor: typeof parsedValor === 'number' ? parsedValor : undefined,
      status: (fixaForm.status || 'ABERTO').toUpperCase(),
      vencimento: fixaForm.vencimento || undefined,
    };
    try {
      let res;
      if (fixaEditing && fixaEditing._id) {
        if (payload.status === 'PAGO') payload.lastPaidAt = new Date().toISOString(); else payload.lastPaidAt = null;
        res = await globalThis.fetch('/api/contafixa', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: fixaEditing._id, ...payload })
        });
      } else {
        if (payload.status === 'PAGO') payload.lastPaidAt = new Date().toISOString();
        res = await globalThis.fetch('/api/contafixa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao salvar conta fixa');
      }
      setShowFixaModal(false);
      setFixaEditing(null);
      fetchFixas();
    } catch (e) {
      globalThis.alert(e.message || 'Erro ao salvar conta fixa');
    }
  }

  async function deleteFixa(id) {
    if (!globalThis.confirm('Tem certeza que deseja excluir esta conta fixa?')) return;
    try {
      const res = await globalThis.fetch('/api/contafixa', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao excluir');
      fetchFixas();
    } catch (e) {
      globalThis.alert(e.message || 'Erro ao excluir conta fixa');
    }
  }

  if (status === "loading") return (<Wrapper>Carregando…</Wrapper>);

  return (
    <Wrapper>
      <Title>Contas a pagar</Title>

      <PageSection>
        <Filters
          dueFrom={dueFrom}
          dueTo={dueTo}
          onChangeDueFrom={setDueFrom}
          onChangeDueTo={setDueTo}
          statusFilter={statusFilter}
          onChangeStatus={setStatusFilter}
          onClear={clearAll}
          inputSx={inputSx}
          rightActions={<SmallSecondaryButton onClick={onGerarPDFFixas}>Gerar PDF (com fixas)</SmallSecondaryButton>}
        />
      </PageSection>

      <H2>Custos ações</H2>
      <SearchRow>
        <SearchCol>
          <label>Buscar</label>
          <FE.Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por Cliente, Ação ou Colaborador (somente Custos ações)"
          />
        </SearchCol>
        <RowInline>
          <SmallSecondaryButton onClick={onGerarPDFAcoes}>Gerar PDF (ações)</SmallSecondaryButton>
        </RowInline>
      </SearchRow>

      <PageSection>
        <AcoesTable
          rows={pageDataAcoes}
          page={pageAcoes}
          pageSize={pageSizeAcoes}
          total={totalAcoes}
          onChangePage={setPageAcoes}
          onChangePageSize={setPageSizeAcoes}
          sortKey={sortKeyAcoes}
          sortDir={sortDirAcoes}
          onToggleSort={toggleSortAcoes}
          onChangeStatus={handleStatusChange}
          session={session}
        />
      </PageSection>

      <H2Large>Contas Fixas</H2Large>
      {session?.user?.role === 'admin' && (
        <RowTopGap>
          <FE.TopButton onClick={openNewFixa}>Nova Conta Fixa</FE.TopButton>
        </RowTopGap>
      )}
      <SmallNote>
        Quando o status estiver "PAGO", mostramos o mês/ano do pagamento e ele volta para "ABERTO" automaticamente após o ciclo (15 dias para quinzenal, 30 dias para mensal).
      </SmallNote>
      <ContasFixasTable
        rows={sortedFixas}
        sortKey={sortKeyFixas}
        sortDir={sortDirFixas}
        onToggleSort={toggleSortFixas}
        page={pageFixas}
        pageSize={pageSizeFixas}
        onChangePage={setPageFixas}
        onChangePageSize={setPageSizeFixas}
        getDisplayStatus={getDisplayStatus}
        formatDateBR={formatDateBR}
        onEdit={openEditFixa}
        onDelete={deleteFixa}
        onStatusChange={handleFixaStatusChange}
      />

      {showFixaModal && (
        <ModalOverlay>
          <ModalCard>
            <h3>{fixaEditing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}</h3>
            <ModalGrid>
              <ModalField>
                <label>Nome</label>
                <FE.Input value={fixaForm.name} onChange={e => setFixaForm(f => ({ ...f, name: e.target.value }))} />
              </ModalField>
              <ModalField>
                <label>Empresa</label>
                <FE.Input value={fixaForm.empresa} onChange={e => setFixaForm(f => ({ ...f, empresa: e.target.value }))} />
              </ModalField>
              <ModalField>
                <label>Tipo</label>
                <FE.Select value={fixaForm.tipo} onChange={e => setFixaForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="quizenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </FE.Select>
              </ModalField>
              <ModalField>
                <label>Status</label>
                <FE.Select value={fixaForm.status} onChange={e => setFixaForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ABERTO">ABERTO</option>
                  <option value="PAGO">PAGO</option>
                </FE.Select>
              </ModalField>
              <ModalField>
                <label>Vencimento</label>
                <BRDateInput
                  value={fixaForm.vencimento}
                  onChange={(iso) => setFixaForm(f => ({ ...f, vencimento: iso }))}
                />
              </ModalField>
              <ModalField>
                <label>Valor</label>
                <BRCurrencyInput value={fixaForm.valor} onChange={(val) => setFixaForm(f => ({ ...f, valor: val }))} />
              </ModalField>
            </ModalGrid>
            <RowEnd>
              <FE.SecondaryButton onClick={() => setShowFixaModal(false)}>Cancelar</FE.SecondaryButton>
              <FE.Button onClick={saveFixa}>Salvar</FE.Button>
            </RowEnd>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}


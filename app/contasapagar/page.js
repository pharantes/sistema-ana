"use client";
/* eslint-env browser */
import styled from "styled-components";
import Pager from "../components/ui/Pager";
import { Table, Th, Td } from "../components/ui/Table";
import ColaboradorCell from "../components/ui/ColaboradorCell";
import Filters from "./Filters";
import ContasFixasTable from "./components/ContasFixasTable";

// Pager now centralized in components/ui/Pager


const Title = styled.h1`
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
`;
const Wrapper = styled.div`
  padding: 16px;
`;

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as FE from "../components/FormElements";
import { formatBRL, parseCurrency } from "../utils/currency";

// Date preset UI moved to Filters component

// Table, Th, Td now imported from components/ui/Table

export default function ContasAPagarPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [pageSizeAcoes, setPageSizeAcoes] = useState(10);
  const [pageAcoes, setPageAcoes] = useState(1);
  const [loading, setLoading] = useState(false);
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
  const inputSx = { height: 40 };

  useEffect(() => {
    try { inputRef.current?.focus(); } catch { /* noop */ }
  }, []);

  // Date preset helpers now encapsulated in Filters
  const clearAll = () => {
    setQuery(""); setDueFrom(""); setDueTo(""); setStatusFilter('ALL');
    try { inputRef.current?.focus(); } catch { /* noop */ }
  };

  async function fetchReports() {
    setLoading(true);
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
    setLoading(false);
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
  const formatDateBR = (val) => {
    if (!val) return '';
    try {
      if (val instanceof Date) return val.toLocaleDateString('pt-BR');
      const s = String(val);
      const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
      const d = new Date(s);
      if (!isNaN(d)) return d.toLocaleDateString('pt-BR');
    } catch { /* ignore */ }
    return '';
  };
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
  const totalPagesAcoes = Math.max(1, Math.ceil(totalAcoes / pageSizeAcoes));
  const pageDataAcoes = useMemo(() => {
    const start = (pageAcoes - 1) * pageSizeAcoes;
    return filtered.slice(start, start + pageSizeAcoes);
  }, [filtered, pageAcoes, pageSizeAcoes]);

  // Generate PDF for Custos ações only (ignores Contas Fixas regardless of search)
  async function gerarPDFAcoes() {
    const rows = filtered;
    if (!rows.length) {
      globalThis.alert("Nenhum resultado para gerar o relatório");
      return;
    }
    const firstDate = rows[0]?.reportDate ? new Date(rows[0].reportDate) : null;
    const lastDate = rows[rows.length - 1]?.reportDate ? new Date(rows[rows.length - 1].reportDate) : null;

    let totalApagar = 0;
    let totalPago = 0;
    let totalLines = 0;
    for (const r of rows) {
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const st = staff.find(s => s.name === r?.staffName);
      const v = Number(st?.value || 0);
      totalApagar += v;
      if ((r?.status || 'ABERTO').toUpperCase() === 'PAGO') totalPago += v;
      totalLines += 1;
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 900;
    const rowHeight = 18;
    const headerHeight = 28;
    const margin = 30;
    const colWidths = [70, 150, 150, 140, 90, 80, 50, 180, 80];
    const pageHeight = margin + headerHeight + (totalLines + 6) * rowHeight + 120;
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = margin;
    const drawText = (text, x, size = 10) => {
      page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
    };

    // Title
    drawText("Custos ações", margin, 16);
    y += 22;
    const range = `${firstDate ? firstDate.toLocaleDateString('pt-BR') : ''} - ${lastDate ? lastDate.toLocaleDateString('pt-BR') : ''}`;
    drawText(`Período: ${range}`, margin, 10);
    y += 16;
    // Totals
    drawText(`Total a pagar: R$ ${totalApagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 16;
    drawText(`Total pago: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 20;

    // Headers
    const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor", "Pgt", "Banco/PIX", "Status"];
    {
      let cx = margin;
      headers.forEach((h, i) => { drawText(h, cx, 9); cx += colWidths[i]; });
    }
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;

    rows.forEach((r) => {
      const data = r?.actionId?.date ? new Date(r.actionId.date).toLocaleDateString('pt-BR') : (r?.reportDate ? new Date(r.reportDate).toLocaleDateString('pt-BR') : '');
      const cliente = r?.actionId?.clientName || r?.actionId?.client || '';
      const acao = r?.actionId?.name || '';
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
      const status = (r?.status || 'ABERTO').toUpperCase();
      let cx = margin;
      drawText(data, cx, 8.5); cx += colWidths[0];
      drawText(cliente, cx, 8.5); cx += colWidths[1];
      drawText(acao, cx, 8.5); cx += colWidths[2];
      let sName = r?.staffName || '';
      if (!sName && r?.costId) {
        const ct = costs.find(c => String(c._id) === String(r.costId));
        if (ct) sName = r?.colaboradorLabel ? `${ct.description || ''} - ${r.colaboradorLabel}` : (ct.description || '');
      }
      drawText(sName, cx, 8.5); cx += colWidths[3];
      const st = staff.find(s => s.name === r?.staffName);
      const venci = st?.vencimento ? new Date(st.vencimento).toLocaleDateString('pt-BR') : '';
      drawText(venci, cx, 8.5); cx += colWidths[4];
      const sVal = (st && typeof st.value !== 'undefined') ? Number(st.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
      drawText(sVal, cx, 8.5); cx += colWidths[5];
      const sPgt = st?.pgt || '';
      drawText(sPgt, cx, 8.5); cx += colWidths[6];
      const disp = (sPgt === 'PIX') ? (st?.pix || '') : (sPgt === 'TED' ? (st?.bank || '') : '');
      drawText(disp, cx, 8.5); cx += colWidths[7];
      drawText(status, cx, 8.5);
      page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
      y += rowHeight;
    });

    const pdfBytes = await doc.save();
    const blob = new globalThis.Blob([pdfBytes], { type: "application/pdf" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = `custos-acoes.pdf`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
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
  const totalFixas = sortedFixas.length;
  // Pagination for fixas is handled within ContasFixasTable; no local page slices needed here
  const toggleSortFixas = (key) => {
    if (sortKeyFixas === key) setSortDirFixas(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKeyFixas(key); setSortDirFixas('asc'); setPageFixas(1); }
  };

  async function gerarPDF() {
    const rows = filtered;
    const includeFixas = (query || '').trim().length === 0; // include Contas Fixas only when not searching
    const fixasRows = includeFixas ? filteredFixas : [];
    if (!rows.length && !(includeFixas && fixasRows.length)) {
      globalThis.alert("Nenhum resultado para gerar o relatório");
      return;
    }
    // Compute display range based on selected filters or available data
    let firstDate = null;
    let lastDate = null;
    if (dueFrom || dueTo) {
      firstDate = dueFrom ? new Date(`${dueFrom}T00:00:00`) : null;
      lastDate = dueTo ? new Date(`${dueTo}T23:59:59`) : null;
    } else if (rows.length) {
      firstDate = rows[0]?.reportDate ? new Date(rows[0].reportDate) : null;
      lastDate = rows[rows.length - 1]?.reportDate ? new Date(rows[rows.length - 1].reportDate) : null;
    } else if (fixasRows.length) {
      const dates = fixasRows.map(c => c.vencimento ? new Date(c.vencimento).getTime() : null).filter(Boolean);
      if (dates.length) {
        dates.sort((a, b) => a - b);
        firstDate = new Date(dates[0]);
        lastDate = new Date(dates[dates.length - 1]);
      }
    }

    // compute insights per row (per-colaborador): total a pagar and total pago
    let totalAcoesApagar = 0;
    let totalAcoesPago = 0;
    let totalLinesAcoes = 0;
    for (const r of rows) {
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
      const st = r?.staffName ? staff.find(s => s.name === r?.staffName) : null;
      const ct = (!r?.staffName && r?.costId) ? costs.find(c => String(c._id) === String(r.costId)) : null;
      const v = Number((st?.value ?? ct?.value) || 0);
      totalAcoesApagar += v;
      if ((r?.status || 'ABERTO').toUpperCase() === 'PAGO') totalAcoesPago += v;
      totalLinesAcoes += 1; // one line per colaborador row
    }

    // Totals for Contas Fixas
    let totalFixasApagar = 0;
    let totalFixasPago = 0;
    for (const c of fixasRows) {
      const v = Number(c?.valor || 0);
      totalFixasApagar += v;
      if (getDisplayStatus(c) === 'PAGO') totalFixasPago += v;
    }
    const totalGeralApagar = totalAcoesApagar + (includeFixas ? totalFixasApagar : 0);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 900;
    const rowHeight = 18;
    const headerHeight = 28;
    const margin = 30;
    // Data, Cliente, Ação, Colaborador, Vencimento, Valor, Pgt, Banco/PIX, Status
    const colWidths = [70, 150, 150, 140, 90, 80, 50, 180, 80];
    // Estimate dynamic height: title + overall + acoes section + fixas section (if any)
    let estHeight = margin;
    estHeight += 22; // title
    estHeight += 18; // overall total line
    estHeight += 12; // gap
    estHeight += 18; // 'Custos ações' label
    estHeight += 36; // acoes totals
    estHeight += headerHeight + Math.max(totalLinesAcoes, 1) * rowHeight + 16; // acoes table + gap
    if (includeFixas) {
      estHeight += 18; // 'Contas Fixas' label
      estHeight += 36; // fixas totals
      // Fixas table header + rows (6 columns)
      estHeight += headerHeight + Math.max(fixasRows.length, 1) * rowHeight + 16;
    }
    estHeight += margin;
    const pageHeight = Math.max(500, estHeight);
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = margin;
    const drawText = (text, x, size = 10) => {
      page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
    };

    // Title and overall summary
    drawText("Contas a pagar", margin, 16);
    y += 22;
    const range = `${firstDate ? firstDate.toLocaleDateString('pt-BR') : ''} - ${lastDate ? lastDate.toLocaleDateString('pt-BR') : ''}`;
    drawText(`Período: ${range}`, margin, 10);
    y += 16;
    drawText(`Total geral (ações${includeFixas ? ' + fixas' : ''}): R$ ${totalGeralApagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 12);
    y += 20;

    // Section: Custos ações
    drawText('Custos ações', margin, 14);
    y += 18;
    drawText(`Total a pagar (ações): R$ ${totalAcoesApagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 16;
    drawText(`Total pago (ações): R$ ${totalAcoesPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 20;

    // Header aligned with Custos ações table
    const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor", "Pgt", "Banco/PIX", "Status"];
    // Draw headers row
    {
      let cx = margin;
      headers.forEach((h, i) => {
        drawText(h, cx, 9);
        cx += colWidths[i];
      });
    }
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;

    // Rows: one line per colaborador entry
    rows.forEach((r) => {
      const data = r?.actionId?.date ? new Date(r.actionId.date).toLocaleDateString('pt-BR') : (r?.reportDate ? new Date(r.reportDate).toLocaleDateString('pt-BR') : '');
      const cliente = r?.actionId?.clientName || r?.actionId?.client || '';
      const acao = r?.actionId?.name || '';
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
      const status = (r?.status || 'ABERTO').toUpperCase();
      let cx = margin;
      drawText(data, cx, 8.5); cx += colWidths[0];
      drawText(cliente, cx, 8.5); cx += colWidths[1];
      drawText(acao, cx, 8.5); cx += colWidths[2];
      const st = r?.staffName ? staff.find(s => s.name === r?.staffName) : null;
      const ct = (!r?.staffName && r?.costId) ? costs.find(c => String(c._id) === String(r.costId)) : null;
      const sName = r?.staffName ? (r?.staffName || '') : (ct?.description || '');
      drawText(sName, cx, 8.5); cx += colWidths[3];
      const venci = st?.vencimento ? new Date(st.vencimento).toLocaleDateString('pt-BR') : (ct?.vencimento ? new Date(ct.vencimento).toLocaleDateString('pt-BR') : '');
      drawText(venci, cx, 8.5); cx += colWidths[4];
      const valNumber = (st && typeof st.value !== 'undefined') ? Number(st.value) : (ct && typeof ct.value !== 'undefined') ? Number(ct.value) : NaN;
      const sVal = Number.isFinite(valNumber) ? valNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
      drawText(sVal, cx, 8.5); cx += colWidths[5];
      const sPgt = (st?.pgt || ct?.pgt || '');
      drawText(sPgt, cx, 8.5); cx += colWidths[6];
      const disp = (sPgt === 'PIX') ? (st?.pix || ct?.pix || '') : (sPgt === 'TED' ? (st?.bank || ct?.bank || '') : '');
      drawText(disp, cx, 8.5); cx += colWidths[7];
      drawText(status, cx, 8.5);
      page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
      y += rowHeight;
    });

    // Optional Section: Contas Fixas
    if (includeFixas) {
      y += 8;
      drawText('Contas Fixas', margin, 14);
      y += 18;
      drawText(`Total a pagar (fixas): R$ ${totalFixasApagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
      y += 16;
      drawText(`Total pago (fixas): R$ ${totalFixasPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
      y += 20;

      // Headers for fixas table: Nome, Empresa, Tipo, Valor, Vencimento, Status
      const fHeaders = ["Nome", "Empresa", "Tipo", "Valor", "Vencimento", "Status"];
      const fColWidths = [180, 180, 90, 90, 110, 100];
      {
        let cx = margin;
        fHeaders.forEach((h, i) => { drawText(h, cx, 9); cx += fColWidths[i]; });
      }
      page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
      y += rowHeight;
      fixasRows.forEach(c => {
        let cx = margin;
        drawText(c.name || '', cx, 8.5); cx += fColWidths[0];
        drawText(c.empresa || '', cx, 8.5); cx += fColWidths[1];
        drawText(String(c.tipo || ''), cx, 8.5); cx += fColWidths[2];
        const fVal = (c.valor != null) ? Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
        drawText(fVal, cx, 8.5); cx += fColWidths[3];
        const fVenc = c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '';
        drawText(fVenc, cx, 8.5); cx += fColWidths[4];
        drawText(getDisplayStatus(c), cx, 8.5);
        page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
        y += rowHeight;
      });
    }

    const pdfBytes = await doc.save();
    const blob = new globalThis.Blob([pdfBytes], { type: "application/pdf" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = `contas-a-pagar.pdf`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
  }

  async function fetchFixas() {
    try {
      const res = await globalThis.fetch('/api/contafixa');
      if (!res.ok) throw new Error('Falha ao carregar contas fixas');
      const data = await res.json();
      setFixas(Array.isArray(data) ? data : []);
    } catch { setFixas([]); }
  }

  async function saveFixa() {
    const parsedValor = parseCurrency(fixaForm.valor);
    const hasValor = typeof parsedValor === 'number';
    const payload = {
      name: fixaForm.name,
      empresa: fixaForm.empresa,
      tipo: fixaForm.tipo,
      valor: hasValor ? parsedValor : undefined,
      status: (fixaForm.status || 'ABERTO').toUpperCase(),
      vencimento: fixaForm.vencimento || undefined,
    };
    try {
      let res;
      if (fixaEditing && fixaEditing._id) {
        // Editing: control lastPaidAt based on chosen status
        if (payload.status === 'PAGO') {
          payload.lastPaidAt = new Date().toISOString();
        } else {
          payload.lastPaidAt = null; // clear prior payments
        }
        res = await globalThis.fetch('/api/contafixa', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: fixaEditing._id, ...payload })
        });
      } else {
        if (payload.status === 'PAGO') {
          payload.lastPaidAt = new Date().toISOString();
        }
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
      // Consume JSON response (ignored) without showing alerts
      await res.json().catch(() => null);
      setShowFixaModal(false);
      setFixaEditing(null);
      setFixaForm({ name: '', empresa: '', tipo: 'mensal', valor: '', status: 'ABERTO', vencimento: '' });
      fetchFixas();
    } catch (e) {
      globalThis.alert(e.message || 'Erro ao salvar conta fixa');
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
      valor: c.valor != null ? Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      status: (c.status || 'ABERTO').toUpperCase(),
      vencimento: c.vencimento ? new Date(c.vencimento).toISOString().slice(0, 10) : '',
    });
    setShowFixaModal(true);
  }

  async function deleteFixa(id) {
    if (!globalThis.confirm('Tem certeza que deseja excluir esta conta fixa?')) return;
    try {
      const res = await globalThis.fetch('/api/contafixa', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Falha ao excluir');
      fetchFixas();
    } catch (e) {
      globalThis.alert(e.message || 'Erro ao excluir conta fixa');
    }
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <Wrapper><Title>Acesso restrito</Title><p>Faça login para acessar.</p></Wrapper>;

  return (
    <Wrapper>
      <Title>Contas a Pagar</Title>
      <Filters
        dueFrom={dueFrom}
        dueTo={dueTo}
        onChangeDueFrom={setDueFrom}
        onChangeDueTo={setDueTo}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        onClear={clearAll}
        inputSx={inputSx}
      />
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: 8 }}>
        <FE.TopSecondaryButton onClick={gerarPDF} disabled={loading}>Gerar PDF</FE.TopSecondaryButton>
      </div>
      <h2 style={{ marginTop: 16 }}>Custos ações</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalAcoes > pageSizeAcoes && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setPageAcoes(p => Math.max(1, p - 1))} disabled={pageAcoes === 1} aria-label="Anterior">«</button>
              {Array.from({ length: totalPagesAcoes }, (_, i) => i + 1).map(n => (
                <button key={n} data-active={n === pageAcoes} onClick={() => setPageAcoes(n)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: n === pageAcoes ? '#2563eb' : '#fff', color: n === pageAcoes ? '#fff' : '#111' }}>{n}</button>
              ))}
              <button onClick={() => setPageAcoes(p => Math.min(totalPagesAcoes, p + 1))} disabled={pageAcoes === totalPagesAcoes} aria-label="Próxima">»</button>
            </div>
          )}
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
          <select value={pageSizeAcoes} onChange={(e) => { setPageAcoes(1); setPageSizeAcoes(Number(e.target.value)); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {totalAcoes}</span>
        </div>
      </div>
      {/* Search limited to Custos ações + PDF for actions only */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginTop: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 280, flex: '1 1 320px' }}>
          <label>Buscar</label>
          <FE.Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por Cliente, Ação ou Colaborador (somente Custos ações)"
            style={{ ...inputSx }}
          />
        </div>
        <FE.SecondaryButton onClick={gerarPDFAcoes} style={{ height: 40 }}>Gerar PDF</FE.SecondaryButton>
      </div>
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSortAcoes('created')}>
              Data {sortKeyAcoes === 'created' ? (sortDirAcoes === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSortAcoes('acao')}>
              Ação {sortKeyAcoes === 'acao' ? (sortDirAcoes === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSortAcoes('colaborador')}>
              Colaborador/Empresa {sortKeyAcoes === 'colaborador' ? (sortDirAcoes === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Descrição</Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSortAcoes('due')}>
              Vencimento {sortKeyAcoes === 'due' ? (sortDirAcoes === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Valor</Th>
            <Th>Pgt</Th>
            <Th>Banco/PIX</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {pageDataAcoes.map(report => (
            <tr key={report._id}>
              <Td>{report.actionId?.date ? new Date(report.actionId.date).toLocaleDateString("pt-BR") : (report.reportDate ? new Date(report.reportDate).toLocaleDateString("pt-BR") : "")}</Td>
              <Td>
                {report?.actionId?._id ? (
                  <button
                    onClick={() => globalThis.location.assign(`/acoes/${report.actionId._id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {report.actionId?.name || ""}
                  </button>
                ) : (report.actionId?.name || "")}
              </Td>
              <Td><ColaboradorCell report={report} /></Td>
              <Td>{(() => {
                // Descrição: staff rows empty, cost rows show description
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                return ct?.description || '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const d = st?.vencimento || ct?.vencimento;
                return d ? new Date(d).toLocaleDateString('pt-BR') : '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const val = (st && typeof st.value !== 'undefined') ? Number(st.value) : (ct && typeof ct.value !== 'undefined') ? Number(ct.value) : null;
                return (val != null) ? val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                return st?.pgt || ct?.pgt || '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const method = (st?.pgt || ct?.pgt || '').toUpperCase();
                if (method === 'PIX') return st?.pix || ct?.pix || '';
                if (method === 'TED') return st?.bank || ct?.bank || '';
                return '';
              })()}</Td>
              <Td>
                {session.user.role === "admin" ? (
                  <FE.Select
                    value={(report.status || "ABERTO").toUpperCase()}
                    onChange={(e) => handleStatusChange(report._id, e.target.value, report.status || "ABERTO")}
                  >
                    <option value="ABERTO">ABERTO</option>
                    <option value="PAGO">PAGO</option>
                  </FE.Select>
                ) : (
                  (report.status || "ABERTO").toUpperCase()
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {totalAcoes > pageSizeAcoes && (
        <Pager page={pageAcoes} pageSize={pageSizeAcoes} total={totalAcoes} onChangePage={setPageAcoes} />
      )}

      {/* Contas Fixas section */}
      <h2 style={{ marginTop: 24 }}>Contas Fixas</h2>
      {session?.user?.role === 'admin' && (
        <div style={{ marginTop: 8 }}>
          <FE.TopButton onClick={openNewFixa}>Nova Conta Fixa</FE.TopButton>
        </div>
      )}
      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: 4 }}>
        Quando o status estiver "PAGO", mostramos o mês/ano do pagamento e ele volta para "ABERTO" automaticamente após o ciclo (15 dias para quinzenal, 30 dias para mensal).
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalFixas > pageSizeFixas && (
            <Pager page={pageFixas} pageSize={pageSizeFixas} total={totalFixas} onChangePage={setPageFixas} />
          )}
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
          <select value={pageSizeFixas} onChange={(e) => { setPageFixas(1); setPageSizeFixas(Number(e.target.value)); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {totalFixas}</span>
        </div>
      </div>
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

      {/* Modal Nova Conta Fixa */}
      {showFixaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 420, maxWidth: '90%' }}>
            <h3>{fixaEditing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Nome</label>
                <FE.Input value={fixaForm.name} onChange={e => setFixaForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Empresa</label>
                <FE.Input value={fixaForm.empresa} onChange={e => setFixaForm(f => ({ ...f, empresa: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Tipo</label>
                <FE.Select value={fixaForm.tipo} onChange={e => setFixaForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="quizenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </FE.Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Status</label>
                <FE.Select value={fixaForm.status} onChange={e => setFixaForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ABERTO">ABERTO</option>
                  <option value="PAGO">PAGO</option>
                </FE.Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Vencimento</label>
                <FE.Input type="date" value={fixaForm.vencimento} onChange={e => setFixaForm(f => ({ ...f, vencimento: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label>Valor</label>
                <FE.Input
                  type="text"
                  value={fixaForm.valor}
                  placeholder="Valor R$"
                  onChange={e => setFixaForm(f => ({ ...f, valor: e.target.value }))}
                  onBlur={e => setFixaForm(f => ({ ...f, valor: formatBRL(e.target.value) }))}
                  onFocus={e => {
                    const raw = String(fixaForm.valor || '').replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
                    setFixaForm(f => ({ ...f, valor: raw }));
                    try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch { /* ignore */ }
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <FE.SecondaryButton onClick={() => setShowFixaModal(false)}>Cancelar</FE.SecondaryButton>
              <FE.Button onClick={saveFixa}>Salvar</FE.Button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}


"use client";
/* eslint-env browser */
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import styled from "styled-components";
import Pager from "../components/ui/Pager";
import { Table, Th, Td } from "../components/ui/Table";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "../utils/currency";
import * as FE from "../components/FormElements";
import Filters from "./Filters";
import ContasReceberModal from "./ContasReceberModal";

// Pager now centralized in components/ui/Pager

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
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
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  async function gerarPDF() {
    // Fetch all rows with current filters to generate full report
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
    if (!rows.length) {
      globalThis.alert("Nenhum resultado para gerar o relatório");
      return;
    }
    const firstDate = rows[0]?.date ? new Date(rows[0].date) : null;
    const lastDate = rows[rows.length - 1]?.date ? new Date(rows[rows.length - 1].date) : null;

    let totalReceber = 0;
    let totalLines = 0;
    for (const a of rows) {
      totalReceber += Number(a?.value || 0);
      const staffLen = Array.isArray(a?.staff) ? a.staff.length : 0;
      totalLines += Math.max(1, staffLen);
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 900;
    const rowHeight = 18;
    const headerHeight = 28;
    const margin = 30;
    // Evento, Cliente, Data, Colaboradores, PIX, Valor
    const colWidths = [160, 200, 100, 180, 150, 100];
    const pageHeight = margin + headerHeight + (totalLines + 5) * rowHeight + 80;
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = margin;
    const drawText = (text, x, size = 10) => {
      page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
    };

    // Title and range
    drawText("Relatório - Contas a Receber", margin, 16);
    y += 22;
    const range = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
    drawText(`Período: ${range}`, margin, 10);
    y += 20;

    // Insights
    drawText(`Total a receber (período): R$ ${formatBRL(totalReceber)}`, margin, 11);
    y += 24;

    // Header
    const headers = ["Evento", "Cliente", "Data", "Colaboradores", "PIX", "Valor (R$)"];
    let x = margin;
    headers.forEach((h, i) => { drawText(h, x, 10); x += colWidths[i]; });
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;

    // Rows: colaboradores/PIX on aligned multiple lines; only first line shows Evento/Cliente/Data/Valor
    rows.forEach((a) => {
      const evento = a?.name || '';
      const cliente = a?.client || '';
      const data = formatDateBR(a?.date);
      const valor = a?.value ? `R$ ${formatBRL(Number(a.value))}` : '-';
      const staff = Array.isArray(a?.staff) ? a.staff : [];
      const lines = Math.max(1, staff.length);

      for (let i = 0; i < lines; i++) {
        let cx = margin;
        if (i === 0) drawText(evento, cx, 8.5); cx += colWidths[0];
        if (i === 0) drawText(cliente, cx, 8.5); cx += colWidths[1];
        if (i === 0) drawText(data, cx, 8.5); cx += colWidths[2];
        const sName = staff[i]?.name || '';
        drawText(sName, cx, 8.5); cx += colWidths[3];
        const sPix = staff[i]?.pix || '';
        drawText(sPix, cx, 8.5); cx += colWidths[4];
        if (i === 0) drawText(valor, cx, 8.5);
        page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
        y += rowHeight;
      }
    });

    const pdfBytes = await doc.save();
    const blob = new globalThis.Blob([pdfBytes], { type: "application/pdf" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = `contas-a-receber.pdf`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
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
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {total > pageSize && (
            <>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Anterior">«</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} data-active={n === page} onClick={() => setPage(n)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: n === page ? '#2563eb' : '#fff', color: n === page ? '#fff' : '#111' }}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Próxima">»</button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
          <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {total}</span>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>
              Data {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer' }} onClick={() => toggleSort('acao')}>
              Ação {sortKey === 'acao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer' }} onClick={() => toggleSort('cliente')}>
              Cliente {sortKey === 'cliente' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Descrição</Th>
            <Th>Qtde Parcela</Th>
            <Th>Valor Parcela</Th>
            <Th style={{ cursor: 'pointer' }} onClick={() => toggleSort('venc')}>
              Data Vencimento {sortKey === 'venc' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer' }} onClick={() => toggleSort('receb')}>
              Data Recebimento {sortKey === 'receb' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Status</Th>
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => {
            const r = row.receivable || {};
            const venc = formatDateBR(r?.dataVencimento);
            const receb = formatDateBR(r?.dataRecebimento);
            const data = formatDateBR(row?.date);
            return (
              <tr key={row._id} onClick={() => globalThis.location.assign(`/contasareceber/${row._id}`)} style={{ cursor: 'pointer' }}>
                <Td>{data}</Td>
                <Td style={{ textAlign: 'left' }}>
                  <span style={{ display: 'inline-block', textAlign: 'left' }}>{row.name}</span>
                </Td>
                <Td>{row.clientName || ''}</Td>
                <Td>{r?.descricao || ''}</Td>
                <Td>{r?.qtdeParcela ?? ''}</Td>
                <Td>{r?.valorParcela != null ? `R$ ${formatBRL(Number(r.valorParcela))}` : ''}</Td>
                <Td>{venc}</Td>
                <Td>{receb}</Td>
                <Td>
                  <FE.Select value={(r?.status || 'ABERTO')} onChange={async (e) => {
                    const next = e.target.value;
                    e.stopPropagation();
                    // optimistic UI
                    setItems(prev => prev.map(it => it._id === row._id ? { ...it, receivable: { ...(it.receivable || {}), status: next } } : it));
                    try {
                      const payload = {
                        id: r?._id,
                        actionId: row._id,
                        clientId: row.clientId,
                        status: next,
                      };
                      const res = await fetch('/api/contasareceber', {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                      });
                      if (!res.ok) throw new Error('Falha ao atualizar status');
                    } catch (err) {
                      alert(err.message || 'Erro ao atualizar status');
                      // revert on error
                      setItems(prev => prev.map(it => it._id === row._id ? { ...it, receivable: { ...(it.receivable || {}), status: (r?.status || 'ABERTO') } } : it));
                    }
                  }} onClick={(e) => e.stopPropagation()}>
                    <option value="ABERTO">ABERTO</option>
                    <option value="RECEBIDO">RECEBIDO</option>
                  </FE.Select>
                </Td>
                <Td>
                  <FE.ActionsRow>
                    <FE.SmallSecondaryButton onClick={(e) => { e.stopPropagation(); setSelectedAction(row); setModalOpen(true); }}>Editar</FE.SmallSecondaryButton>
                  </FE.ActionsRow>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {total > pageSize && (
        <Pager page={page} pageSize={pageSize} total={total} onChangePage={setPage} />
      )}
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


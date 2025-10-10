"use client";
/* eslint-env browser */
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatBRL, parseCurrency } from "../utils/currency";
import styled from "styled-components";
import Pager from "../components/ui/Pager";
import { Table, Th, Td } from "../components/ui/Table";
import Filters from "./Filters";

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
  const [actions, setActions] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // currency helpers now imported from utils

  useEffect(() => { fetchActions(); }, []);

  async function fetchActions() {
    setLoading(true);
    const res = await globalThis.fetch("/api/action");
    const data = await res.json();
    setActions(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const base = Array.isArray(actions) ? actions : [];
    const out = q
      ? base.filter(a => {
        const cliente = (a?.client || "").toLowerCase();
        const acao = (a?.name || "").toLowerCase();
        return cliente.includes(q) || acao.includes(q);
      })
      : base;
    // sort by date desc (newest first)
    return out.slice().sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }, [actions, query]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  async function gerarPDF() {
    const rows = filtered;
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
    const range = `${firstDate ? firstDate.toLocaleDateString('pt-BR') : ''} - ${lastDate ? lastDate.toLocaleDateString('pt-BR') : ''}`;
    drawText(`Período: ${range}`, margin, 10);
    y += 20;

    // Insights
    drawText(`Total a receber (período): R$ ${totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
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
      const data = a?.date ? new Date(a.date).toLocaleDateString('pt-BR') : '';
      const valor = a?.value ? `R$ ${Number(a.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
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

  async function handleSave(id) {
    setLoading(true);
    const parsed = parseCurrency(editValue);
    await globalThis.fetch("/api/action/edit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value: parsed }),
    });
    setEditId(null);
    setEditValue("");
    fetchActions();
    setLoading(false);
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session || session.user.role !== "admin") {
    return <Wrapper><Title>Acesso restrito</Title><p>Somente administradores podem acessar esta página.</p></Wrapper>;
  }
  return (
    <Wrapper>
      <Title>Contas a Receber</Title>
      <Filters query={query} onChangeQuery={setQuery} onGerarPDF={gerarPDF} loading={loading} />
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
            <Th>Evento</Th>
            <Th>Cliente</Th>
            <Th>Valor a Receber</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {pageData.map(action => (
            <tr key={action._id}>
              <Td>
                {action?._id ? (
                  <button
                    onClick={() => globalThis.location.assign(`/acoes/${action._id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {action.name}
                  </button>
                ) : action.name}
              </Td>
              <Td>
                {action?.client ? (
                  <span style={{ color: '#111' }}>{action.client}</span>
                ) : ''}
              </Td>
              <Td>
                {editId === action._id ? (
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={e => setEditValue(formatBRL(e.target.value))}
                    onFocus={e => {
                      const raw = String(editValue || '').replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
                      setEditValue(raw);
                      try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch { /* ignore */ }
                    }}
                    placeholder="Valor R$"
                  />
                ) : (
                  action.value ? `R$ ${Number(action.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-"
                )}
              </Td>
              <Td>
                {editId === action._id ? (
                  <button onClick={() => handleSave(action._id)} disabled={loading}>Salvar</button>
                ) : (
                  <button onClick={() => { setEditId(action._id); setEditValue(action.value != null ? Number(action.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ""); }}>Editar</button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {total > pageSize && (
        <Pager page={page} pageSize={pageSize} total={total} onChangePage={setPage} />
      )}
    </Wrapper>
  );
}


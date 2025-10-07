"use client";
import styled from "styled-components";


const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
`;

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;

export default function ContasAPagarPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/contasapagar");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao carregar contas a pagar");
      }
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert(e.message || "Falha ao carregar contas a pagar");
      setReports([]);
    }
    setLoading(false);
  }

  // Removed delete functionality per new requirements

  async function handleStatusChange(id, next, current) {
    if (!session || session.user.role !== "admin") return;
    // Optimistically set to selected value
    setReports(prev => prev.map(r => (r._id === id ? { ...r, status: next } : r)));
    try {
      const res = await fetch("/api/contasapagar", {
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
      alert(e.message || "Erro ao atualizar status");
      // revert on error
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: current } : r)));
    }
  }

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const base = Array.isArray(reports) ? reports : [];
    const out = q
      ? base.filter(r => {
        const cliente = (r?.actionId?.client || "").toLowerCase();
        const acao = (r?.actionId?.name || "").toLowerCase();
        return cliente.includes(q) || acao.includes(q);
      })
      : base;
    // sort by reportDate asc
    return out.slice().sort((a, b) => {
      const da = a?.reportDate ? new Date(a.reportDate).getTime() : 0;
      const db = b?.reportDate ? new Date(b.reportDate).getTime() : 0;
      return da - db;
    });
  }, [reports, query]);

  async function gerarPDF() {
    const rows = filtered;
    if (!rows.length) {
      alert("Nenhum resultado para gerar o relatório");
      return;
    }
    const firstDate = rows[0]?.reportDate ? new Date(rows[0].reportDate) : null;
    const lastDate = rows[rows.length - 1]?.reportDate ? new Date(rows[rows.length - 1].reportDate) : null;

    // compute insights: total a pagar (somatório dos valores dos servidores), e total pago (apenas status PAGO)
    let totalApagar = 0;
    let totalPago = 0;
    let totalLines = 0;
    for (const r of rows) {
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const soma = staff.reduce((acc, s) => acc + Number(s?.value || 0), 0);
      totalApagar += soma;
      if ((r?.status || "ABERTO").toUpperCase() === "PAGO") totalPago += soma;
      totalLines += Math.max(1, staff.length || 0);
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 900;
    const rowHeight = 18;
    const headerHeight = 28;
    const margin = 30;
    const colWidths = [80, 160, 160, 120, 160, 120, 80];
    const pageHeight = margin + headerHeight + (totalLines + 6) * rowHeight + 80;
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = margin;
    const drawText = (text, x, size = 10) => {
      page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
    };

    // Title
    drawText("Relatório - Contas a Pagar", margin, 16);
    y += 22;
    const range = `${firstDate ? firstDate.toLocaleDateString('pt-BR') : ''} - ${lastDate ? lastDate.toLocaleDateString('pt-BR') : ''}`;
    drawText(`Período: ${range}`, margin, 10);
    y += 20;

    // Insights
    drawText(`Total a pagar (período): R$ ${totalApagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 16;
    drawText(`Total pago (período): R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, 11);
    y += 24;

    // Header
    const headers = ["Data", "Cliente", "Ação", "Vencimento", "Servidores", "PIX", "Status"];
    let x = margin;
    headers.forEach((h, i) => { drawText(h, x, 10); x += colWidths[i]; });
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;

    // Rows with servidores/PIX on multiple lines aligned
    rows.forEach((r) => {
      const data = r?.reportDate ? new Date(r.reportDate).toLocaleDateString('pt-BR') : '';
      const cliente = r?.actionId?.client || '';
      const acao = r?.actionId?.name || '';
      const venc = r?.actionId?.dueDate ? new Date(r.actionId.dueDate).toLocaleDateString('pt-BR') : '';
      const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
      const status = (r?.status || 'ABERTO').toUpperCase();
      const lines = Math.max(1, staff.length || 0);

      for (let i = 0; i < lines; i++) {
        let cx = margin;
        if (i === 0) drawText(data, cx, 8.5); cx += colWidths[0];
        if (i === 0) drawText(cliente, cx, 8.5); cx += colWidths[1];
        if (i === 0) drawText(acao, cx, 8.5); cx += colWidths[2];
        if (i === 0) drawText(venc, cx, 8.5); cx += colWidths[3];
        const sName = staff[i]?.name || '';
        drawText(sName, cx, 8.5); cx += colWidths[4];
        const sPix = staff[i]?.pix || '';
        drawText(sPix, cx, 8.5); cx += colWidths[5];
        if (i === 0) drawText(status, cx, 8.5);
        page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
        y += rowHeight;
      }
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contas-a-pagar.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <Wrapper><Title>Acesso restrito</Title><p>Faça login para acessar.</p></Wrapper>;

  return (
    <Wrapper>
      <Title>Contas a Pagar</Title>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cliente ou ação..."
          style={{ padding: 8, minWidth: 280 }}
        />
        <button onClick={gerarPDF} disabled={loading}>Gerar PDF</button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Cliente</Th>
            <Th>Ação</Th>
            <Th>Vencimento</Th>
            <Th>Servidores</Th>
            <Th>PIX</Th>
            <Th>PDF</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(report => (
            <tr key={report._id}>
              <Td>{report.reportDate ? new Date(report.reportDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>{report.actionId?.client || ""}</Td>
              <Td>{report.actionId?.name || ""}</Td>
              <Td>{report.actionId?.dueDate ? new Date(report.actionId.dueDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>
                {Array.isArray(report.actionId?.staff)
                  ? report.actionId.staff.map((s, idx) => (
                    <div key={report._id + "-staff-" + idx}>{s?.name || ""}</div>
                  ))
                  : ""}
              </Td>
              <Td>
                {Array.isArray(report.actionId?.staff)
                  ? report.actionId.staff.map((s, idx) => (
                    <div key={report._id + "-pix-" + idx}>{s?.pix || ""}</div>
                  ))
                  : ""}
              </Td>
              <Td>{report.pdfUrl ? <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> : ""}</Td>
              <Td>
                {session.user.role === "admin" ? (
                  <select
                    value={(report.status || "ABERTO").toUpperCase()}
                    onChange={(e) => handleStatusChange(report._id, e.target.value, report.status || "ABERTO")}
                  >
                    <option value="ABERTO">ABERTO</option>
                    <option value="PAGO">PAGO</option>
                  </select>
                ) : (
                  (report.status || "ABERTO").toUpperCase()
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}

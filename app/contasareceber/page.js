"use client";
import { useSession } from "next-auth/react";
import styled from "styled-components";


const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
`;

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

export default function ContasAReceberPage() {
  const { data: session, status } = useSession();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { fetchActions(); }, []);

  async function fetchActions() {
    setLoading(true);
    const res = await fetch("/api/action");
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
    // sort by date asc
    return out.slice().sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
  }, [actions, query]);

  async function gerarPDF() {
    const rows = filtered;
    if (!rows.length) {
      alert("Nenhum resultado para gerar o relatório");
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
    // Evento, Cliente, Data, Servidores, PIX, Valor
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
    const headers = ["Evento", "Cliente", "Data", "Servidores", "PIX", "Valor (R$)"];
    let x = margin;
    headers.forEach((h, i) => { drawText(h, x, 10); x += colWidths[i]; });
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;

    // Rows: servidores/PIX on aligned multiple lines; only first line shows Evento/Cliente/Data/Valor
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
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contas-a-receber.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave(id) {
    setLoading(true);
    await fetch("/api/action/edit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value: editValue }),
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
            <Th>Evento</Th>
            <Th>Cliente</Th>
            <Th>Valor a Receber</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(action => (
            <tr key={action._id}>
              <Td>{action.name}</Td>
              <Td>{action.client}</Td>
              <Td>
                {editId === action._id ? (
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} />
                ) : (
                  action.value ? `R$ ${Number(action.value).toFixed(2)}` : "-"
                )}
              </Td>
              <Td>
                {editId === action._id ? (
                  <button onClick={() => handleSave(action._id)} disabled={loading}>Salvar</button>
                ) : (
                  <button onClick={() => { setEditId(action._id); setEditValue(action.value || ""); }}>Editar</button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}

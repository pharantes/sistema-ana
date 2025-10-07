"use client";
import styled from "styled-components";
import { useEffect, useState, useCallback } from "react";
import * as FE from "../components/FormElements";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
`;
const PDFButton = styled.button`
  margin-bottom: 16px;
  padding: 8px 16px;
  background: #00bcd4;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #0097a7;
  }
`;
const SearchBarWrapper = styled.div`
  margin-bottom: 16px;
`;
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

function formatDate(date) {
  if (!date) return "";
  try {
    return typeof window !== "undefined"
      ? new Date(date).toLocaleDateString("pt-BR")
      : "";
  } catch {
    return "";
  }
}

import ActionModal from "../components/ActionModal";

export default function AcoesPage() {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [acoes, setAcoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  const fetchAcoes = useCallback(async (q = "") => {
    setLoading(true);
    const url = q ? `/api/action?q=${encodeURIComponent(q)}` : "/api/action";
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      setAcoes([]);
      setFiltered([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    const safeData = Array.isArray(data) ? data : [];
    setAcoes(safeData);
    setFiltered(flattenAcoes(safeData));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAcoes();
  }, [fetchAcoes]);

  useEffect(() => {
    if (search) {
      fetchAcoes(search);
    } else {
      fetchAcoes();
    }
  }, [search, fetchAcoes]);

  function flattenAcoes(acoesList) {
    const rows = [];
    for (const acao of acoesList) {
      if (Array.isArray(acao.staff)) {
        for (const staff of acao.staff) {
          rows.push({
            _id: acao._id,
            name: acao.name,
            client: acao.client,
            date: acao.date,
            paymentMethod: acao.paymentMethod,
            dueDate: acao.dueDate,
            staffName: staff.name,
            staffBank: staff.bank,
            staffPix: staff.pix,
            staffValue: staff.value,
          });
        }
      }
    }
    return rows;
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  async function gerarPDF() {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 900;
    const rowHeight = 18;
    const headerHeight = 28;
    const margin = 30;
    const colWidths = [70, 90, 140, 140, 80, 110, 80, 90];
    const pageHeight = margin + headerHeight + (filtered.length + 2) * rowHeight + 40;
    const page = doc.addPage([pageWidth, pageHeight]);
    let y = margin;
    page.drawText("Relatório de Ações", { x: margin, y: page.getHeight() - y, size: 16, font });
    y += headerHeight;
    // Draw header
    let x = margin;
    const headers = ["Data", "Ação", "Cliente", "Prestador", "Valor (R$)", "Pix", "Banco", "Vencimento"];
    headers.forEach((h, i) => {
      page.drawText(h, { x, y: page.getHeight() - y, size: 10, font });
      x += colWidths[i];
    });
    // Draw header line
    page.drawLine({
      start: { x: margin, y: page.getHeight() - y - 4 },
      end: { x: pageWidth - margin, y: page.getHeight() - y - 4 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7) // light gray
    });
    y += rowHeight;
    let total = 0;
    filtered.forEach((row) => {
      x = margin;
      const values = [
        formatDate(row.date),
        row.name || "",
        row.client || "",
        row.staffName || "",
        row.staffValue ? `R$ ${row.staffValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "",
        row.staffPix || "",
        row.staffBank || "",
        formatDate(row.dueDate)
      ];
      // Sum total value
      if (row.staffValue) {
        total += Number(row.staffValue);
      }
      values.forEach((v, i) => {
        page.drawText(String(v), { x, y: page.getHeight() - y, size: 8, font });
        x += colWidths[i];
      });
      // Draw row line
      page.drawLine({
        start: { x: margin, y: page.getHeight() - y - 2 },
        end: { x: pageWidth - margin, y: page.getHeight() - y - 2 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85) // lighter gray
      });
      y += rowHeight;
    });
    // Draw total
    page.drawText(
      `Valor total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      { x: margin, y: page.getHeight() - y - 10, size: 10, font }
    );
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-acoes.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    // After generating the PDF for the user, also create contas a pagar entries
    try {
      const uniqueActionIds = Array.from(new Set(filtered.map((row) => row._id))).filter(Boolean);
      for (const actionId of uniqueActionIds) {
        const res = await fetch(`/api/action/report/${actionId}`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Erro ao criar conta para ação', actionId, err);
        }
      }
    } catch (e) {
      console.error('Falha ao criar contas após gerar PDF', e);
    }
  }

  return (
    <Wrapper>
      <Title>Ações</Title>
      <SearchBarWrapper>
        <FE.Input
          type="text"
          placeholder="Buscar por cliente, ação, data ou vencimento..."
          value={search}
          onChange={handleSearchChange}
        />
      </SearchBarWrapper>
      <PDFButton onClick={gerarPDF}>Gerar PDF</PDFButton>
      <FE.TopButton onClick={() => setActionModalOpen(true)}>Nova Ação</FE.TopButton>
      {actionModalOpen && (
        <ActionModal
          editing={editingAction}
          form={{}}
          setForm={() => { }}
          staffRows={[]}
          setStaffRows={() => { }}
          onClose={() => setActionModalOpen(false)}
          onSubmit={async (payload) => {
            try {
              setLoading(true);
              const res = await fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('Erro ao salvar: ' + (err.error || res.statusText));
                setLoading(false);
                return;
              }
              // success: close modal and refresh
              setActionModalOpen(false);
              setEditingAction(null);
              await fetchAcoes();
            } catch (err) {
              console.error(err);
              alert('Erro ao salvar a ação');
            } finally {
              setLoading(false);
            }
          }}
          loading={loading}
        />
      )}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Ação</Th>
              <Th>Cliente</Th>
              <Th>Prestador</Th>
              <Th>Valor (R$)</Th>
              <Th>Pix</Th>
              <Th>Banco</Th>
              <Th>Vencimento</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row._id + "-" + i}>
                <Td>{formatDate(row.date)}</Td>
                <Td>{row.name}</Td>
                <Td>{row.client}</Td>
                <Td>{row.staffName}</Td>
                <Td>{row.staffValue ? `R$ ${row.staffValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ""}</Td>
                <Td>{row.staffPix}</Td>
                <Td>{row.staffBank}</Td>
                <Td>{formatDate(row.dueDate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Wrapper>
  );
}

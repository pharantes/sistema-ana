"use client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

// Gera o PDF de Contas a Receber com o mesmo layout que já existia na página
export async function gerarContasAReceberPDF(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    globalThis.alert("Nenhum resultado para gerar o relatório");
    return;
  }

  const firstDate = safeRows[0]?.date ? new Date(safeRows[0].date) : null;
  const lastDate = safeRows[safeRows.length - 1]?.date ? new Date(safeRows[safeRows.length - 1].date) : null;

  let totalReceber = 0;
  let totalLines = 0;
  for (const a of safeRows) {
    totalReceber += Number(a?.receivable?.valor ?? 0);
    const staffLen = Array.isArray(a?.staff) ? a.staff.length : 0;
    totalLines += Math.max(1, staffLen);
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pageWidth = 900;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  // Evento, Cliente, Data, Colaboradores, PIX, Valor total (R$)
  const colWidths = [160, 200, 100, 180, 150, 100];
  const pageHeight = margin + headerHeight + (totalLines + 5) * rowHeight + 80;
  const page = doc.addPage([pageWidth, pageHeight]);
  let y = margin;
  const drawText = (text, x, size = 10) => {
    page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
  };

  // Título e período
  drawText("Relatório - Contas a Receber", margin, 16);
  y += 22;
  const range = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${range}`, margin, 10);
  y += 20;

  // Totais
  drawText(`Total a receber (período): R$ ${formatBRL(totalReceber)}`, margin, 11);
  y += 24;

  // Cabeçalho
  const headers = ["Evento", "Cliente", "Data", "Colaboradores", "PIX", "Valor total (R$)"];
  let x = margin;
  headers.forEach((h, i) => { drawText(h, x, 10); x += colWidths[i]; });
  page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  y += rowHeight;

  // Linhas
  safeRows.forEach((a) => {
    const evento = a?.name || '';
    const cliente = a?.client || '';
    const data = formatDateBR(a?.date);
    const valor = (a?.receivable?.valor != null) ? `R$ ${formatBRL(Number(a.receivable.valor))}` : '-';
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

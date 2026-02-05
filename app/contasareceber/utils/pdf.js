"use client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Calculates the total receivable amount from all rows.
 * @param {Array} rows - Array of receivable rows
 * @returns {number} Total amount to receive
 */
function calculateTotalReceivable(rows) {
  return rows.reduce((total, row) => {
    return total + Number(row?.receivable?.valor ?? 0);
  }, 0);
}

/**
 * Generates a PDF report for Contas a Receber (Accounts Receivable).
 * Creates a formatted table with action details showing total receivable amount per action.
 * @param {Array} rows - Array of receivable action objects
 * @param {Object} filters - Applied filters (query, mode, dateFrom, dateTo, statusFilter)
 */
export async function gerarContasAReceberPDF(rows, filters = {}) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (!validRows.length) {
    throw new Error("Nenhum resultado para gerar o relatório");
  }

  const firstDate = validRows[0]?.date ? new Date(validRows[0].date) : null;
  const lastDate = validRows[validRows.length - 1]?.date
    ? new Date(validRows[validRows.length - 1].date)
    : null;

  const totalReceivable = calculateTotalReceivable(validRows);
  const totalLines = validRows.length;

  // PDF configuration constants
  const pdfDocument = await PDFDocument.create();
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageWidth = 850;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  const columnWidths = [180, 200, 100, 100, 100, 160];

  // Calculate page height including filter info
  const filterLineCount = [filters.query, filters.dateFrom, filters.statusFilter].filter(Boolean).length;
  const extraHeight = filterLineCount > 0 ? filterLineCount * 16 + 12 : 0;
  const pageHeight = margin + headerHeight + (totalLines + 5) * rowHeight + 80 + extraHeight;
  const page = pdfDocument.addPage([pageWidth, pageHeight]);

  let currentY = margin;

  /**
   * Helper function to draw text at the current Y position.
   * @param {string} text - Text to draw
   * @param {number} xPosition - X coordinate
   * @param {number} fontSize - Font size
   */
  const drawText = (text, xPosition, fontSize = 10) => {
    page.drawText(String(text ?? ""), {
      x: xPosition,
      y: page.getHeight() - currentY,
      size: fontSize,
      font
    });
  };

  // Draw title
  drawText("Relatório - Contas a Receber", margin, 16);
  currentY += 22;


  // Draw period
  const dateRange = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${dateRange}`, margin, 10);
  currentY += 16;

  // Draw active filters
  if (filters.query) {
    drawText(`Busca: ${filters.query}`, margin, 9);
    currentY += 14;
  }
  if (filters.dateFrom || filters.dateTo) {
    const dateMode = filters.mode === 'receb' ? 'Recebimento' : 'Vencimento';
    const fromDate = filters.dateFrom ? formatDateBR(new Date(filters.dateFrom)) : '-';
    const toDate = filters.dateTo ? formatDateBR(new Date(filters.dateTo)) : '-';
    drawText(`Filtro ${dateMode}: ${fromDate} até ${toDate}`, margin, 9);
    currentY += 14;
  }
  if (filters.statusFilter && filters.statusFilter !== 'ALL') {
    drawText(`Status: ${filters.statusFilter}`, margin, 9);
    currentY += 14;
  }

  if (filterLineCount > 0) {
    currentY += 8; // Extra spacing after filters
  }

  // Draw total
  drawText(`Total a receber (período): R$ ${formatBRL(totalReceivable)}`, margin, 11);
  currentY += 24;

  // Draw table header
  const headers = ["Ação", "Cliente", "Data", "Status", "Vencimento", "Valor a Receber (R$)"];
  let currentX = margin;
  headers.forEach((headerText, index) => {
    drawText(headerText, currentX, 10);
    currentX += columnWidths[index];
  });

  // Draw header line
  page.drawLine({
    start: { x: margin, y: page.getHeight() - currentY - 4 },
    end: { x: pageWidth - margin, y: page.getHeight() - currentY - 4 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });
  currentY += rowHeight;

  // Draw data rows - one row per action
  validRows.forEach((actionRow) => {
    const actionName = actionRow?.name || '';
    const clientName = actionRow?.client || '';
    const actionDate = formatDateBR(actionRow?.date);
    const receivable = actionRow?.receivable || {};
    const status = receivable?.status || 'ABERTO';
    const vencimento = receivable?.vencimento ? formatDateBR(new Date(receivable.vencimento)) : '-';
    const valor = (receivable?.valor != null)
      ? formatBRL(Number(receivable.valor))
      : '0,00';

    let cellX = margin;

    // Draw action name
    drawText(actionName, cellX, 8.5);
    cellX += columnWidths[0];

    // Draw client name
    drawText(clientName, cellX, 8.5);
    cellX += columnWidths[1];

    // Draw date
    drawText(actionDate, cellX, 8.5);
    cellX += columnWidths[2];

    // Draw status
    drawText(status, cellX, 8.5);
    cellX += columnWidths[3];

    // Draw vencimento
    drawText(vencimento, cellX, 8.5);
    cellX += columnWidths[4];

    // Draw valor
    drawText(`R$ ${valor}`, cellX, 8.5);

    // Draw row separator line
    page.drawLine({
      start: { x: margin, y: page.getHeight() - currentY - 2 },
      end: { x: pageWidth - margin, y: page.getHeight() - currentY - 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85)
    });

    currentY += rowHeight;
  });

  // Download the PDF
  const pdfBytes = await pdfDocument.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = 'contas-a-receber.pdf';
  anchor.click();
  URL.revokeObjectURL(url);
}

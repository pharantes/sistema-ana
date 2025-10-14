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
 * Calculates the total number of lines needed for the PDF table.
 * Each row needs at least one line, plus additional lines for multiple staff members.
 * @param {Array} rows - Array of receivable rows
 * @returns {number} Total number of lines needed
 */
function calculateTotalLines(rows) {
  return rows.reduce((totalLines, row) => {
    const staffCount = Array.isArray(row?.staff) ? row.staff.length : 0;
    return totalLines + Math.max(1, staffCount);
  }, 0);
}

/**
 * Downloads a PDF blob as a file.
 * @param {Uint8Array} pdfBytes - The PDF document bytes
 * @param {string} filename - The filename for the download
 */
function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates a PDF report for Contas a Receber (Accounts Receivable).
 * Creates a formatted table with action details, client info, and staff assignments.
 * @param {Array} rows - Array of receivable action objects
 */
export async function gerarContasAReceberPDF(rows) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (!validRows.length) {
    alert("Nenhum resultado para gerar o relatório");
    return;
  }

  const firstDate = validRows[0]?.date ? new Date(validRows[0].date) : null;
  const lastDate = validRows[validRows.length - 1]?.date
    ? new Date(validRows[validRows.length - 1].date)
    : null;

  const totalReceivable = calculateTotalReceivable(validRows);
  const totalLines = calculateTotalLines(validRows);

  // PDF configuration constants
  const pdfDocument = await PDFDocument.create();
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageWidth = 900;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  const columnWidths = [160, 200, 100, 180, 150, 100];
  const pageHeight = margin + headerHeight + (totalLines + 5) * rowHeight + 80;
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
  currentY += 20;

  // Draw total
  drawText(`Total a receber (período): R$ ${formatBRL(totalReceivable)}`, margin, 11);
  currentY += 24;

  // Draw table header
  const headers = ["Evento", "Cliente", "Data", "Colaboradores", "PIX", "Valor total (R$)"];
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

  // Draw data rows
  validRows.forEach((actionRow) => {
    const eventName = actionRow?.name || '';
    const clientName = actionRow?.client || '';
    const actionDate = formatDateBR(actionRow?.date);
    const totalValue = (actionRow?.receivable?.valor != null)
      ? `R$ ${formatBRL(Number(actionRow.receivable.valor))}`
      : '-';
    const staffList = Array.isArray(actionRow?.staff) ? actionRow.staff : [];
    const linesNeeded = Math.max(1, staffList.length);

    for (let lineIndex = 0; lineIndex < linesNeeded; lineIndex++) {
      let cellX = margin;

      // Draw event name (first line only)
      if (lineIndex === 0) {
        drawText(eventName, cellX, 8.5);
      }
      cellX += columnWidths[0];

      // Draw client name (first line only)
      if (lineIndex === 0) {
        drawText(clientName, cellX, 8.5);
      }
      cellX += columnWidths[1];

      // Draw date (first line only)
      if (lineIndex === 0) {
        drawText(actionDate, cellX, 8.5);
      }
      cellX += columnWidths[2];

      // Draw staff name
      const staffName = staffList[lineIndex]?.name || '';
      drawText(staffName, cellX, 8.5);
      cellX += columnWidths[3];

      // Draw PIX info
      const pixInfo = staffList[lineIndex]?.pix || '';
      drawText(pixInfo, cellX, 8.5);
      cellX += columnWidths[4];

      // Draw total value (first line only)
      if (lineIndex === 0) {
        drawText(totalValue, cellX, 8.5);
      }

      // Draw row separator line
      page.drawLine({
        start: { x: margin, y: page.getHeight() - currentY - 2 },
        end: { x: pageWidth - margin, y: page.getHeight() - currentY - 2 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85)
      });
      currentY += rowHeight;
    }
  });

  const pdfBytes = await pdfDocument.save();
  downloadPDF(pdfBytes, 'contas-a-receber.pdf');
}

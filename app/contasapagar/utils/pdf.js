"use client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDateBR, formatMonthYearBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

/**
 * Downloads a PDF document by creating a temporary anchor element.
 * @param {Uint8Array} pdfBytes - The PDF document bytes
 * @param {string} filename - The filename for the download
 */
function downloadPDFDocument(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Creates a text clipping function that truncates text to fit within a maximum width.
 * @param {object} font - The PDF font object
 * @returns {Function} Function that clips text to fit width
 */
function createTextClipper(font) {
  /**
   * Measures the width of text at a given size.
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size
   * @returns {number} Width in points
   */
  const measureText = (text, fontSize = 10) => {
    return font.widthOfTextAtSize(String(text ?? ''), fontSize);
  };

  /**
   * Clips text to fit within maximum width, adding ellipsis if needed.
   * @param {string} text - Text to clip
   * @param {number} maxWidth - Maximum width in points
   * @param {number} fontSize - Font size
   * @returns {string} Clipped text with ellipsis if truncated
   */
  return function clipText(text, maxWidth, fontSize = 10) {
    const availableWidth = Math.max(0, (maxWidth || 0) - 4);
    let textString = String(text ?? '');
    if (!textString) return '';
    if (measureText(textString, fontSize) <= availableWidth) return textString;

    const ellipsis = '…';
    let low = 0;
    let high = textString.length;

    // Binary search for optimal truncation point
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (measureText(textString.slice(0, mid) + ellipsis, fontSize) <= availableWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return textString.slice(0, low) + ellipsis;
  };
}

/**
 * Calculates totals and line counts for action costs.
 * @param {Array} rows - Array of report rows
 * @returns {object} Object with totalToPay, totalPaid, and totalLines
 */
function calculateActionTotals(rows) {
  let totalToPay = 0;
  let totalPaid = 0;
  let totalLines = 0;

  for (const row of rows) {
    const staffList = Array.isArray(row?.actionId?.staff) ? row.actionId.staff : [];
    const staffMember = staffList.find(s => s.name === row?.staffName);
    const value = Number(staffMember?.value || 0);
    totalToPay += value;
    if ((row?.status || 'ABERTO').toUpperCase() === 'PAGO') {
      totalPaid += value;
    }
    totalLines += 1;
  }

  return { totalToPay, totalPaid, totalLines };
}

/**
 * Calculates total amounts for fixed accounts.
 * @param {Array} fixedAccounts - Array of fixed account rows
 * @param {Function} getDisplayStatus - Function to get display status of fixed account
 * @returns {{totalToPay: number, totalPaid: number}}
 */
function calculateFixedAccountTotals(fixedAccounts, getDisplayStatus) {
  let totalToPay = 0;
  let totalPaid = 0;

  for (const account of fixedAccounts) {
    const accountValue = Number(account?.valor || 0);
    totalToPay += accountValue;
    if (getDisplayStatus?.(account) === 'PAGO') {
      totalPaid += accountValue;
    }
  }

  return { totalToPay, totalPaid };
}

/**
 * Generates a PDF report for action costs (Custos ações).
 * @param {Array} rows - Array of report row objects
 * @param {Object} filters - Applied filters (searchQuery, statusFilter, dueFrom, dueTo)
 */
export async function gerarPDFAcoes(rows, filters = {}) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (!validRows.length) {
    throw new Error("Nenhum resultado para gerar o relatório");
  }

  const firstDate = validRows[0]?.reportDate ? new Date(validRows[0].reportDate) : null;
  const lastDate = validRows[validRows.length - 1]?.reportDate
    ? new Date(validRows[validRows.length - 1].reportDate)
    : null;

  const { totalToPay, totalPaid, totalLines } = calculateActionTotals(validRows);

  // Calculate extra height for filter information
  const filterLineCount = [filters.searchQuery, filters.statusFilter, (filters.dueFrom || filters.dueTo)].filter(Boolean).length;
  const extraHeight = filterLineCount > 0 ? filterLineCount * 14 + 8 : 0;

  // PDF configuration
  const pdfDocument = await PDFDocument.create();
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageWidth = 900;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  const columnWidths = [70, 150, 150, 140, 90, 80, 50, 180, 80];
  const pageHeight = margin + headerHeight + (totalLines + 6) * rowHeight + 120 + extraHeight;
  const page = pdfDocument.addPage([pageWidth, pageHeight]);

  let currentY = margin;

  /**
   * Draws text at the specified position.
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

  const clipText = createTextClipper(font);

  // Draw title
  drawText("Custos ações", margin, 16);
  currentY += 22;

  // Draw period
  const dateRange = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${dateRange}`, margin, 10);
  currentY += 16;

  // Draw active filters
  if (filters.searchQuery) {
    drawText(`Busca: ${filters.searchQuery}`, margin, 9);
    currentY += 14;
  }
  if (filters.dueFrom || filters.dueTo) {
    const fromDate = filters.dueFrom ? formatDateBR(new Date(filters.dueFrom)) : '-';
    const toDate = filters.dueTo ? formatDateBR(new Date(filters.dueTo)) : '-';
    drawText(`Filtro Vencimento: ${fromDate} até ${toDate}`, margin, 9);
    currentY += 14;
  }
  if (filters.statusFilter && filters.statusFilter !== 'ALL') {
    drawText(`Status: ${filters.statusFilter}`, margin, 9);
    currentY += 14;
  }

  if (filterLineCount > 0) {
    currentY += 4; // Extra spacing after filters
  }

  // Draw totals
  drawText(`Total a pagar (Valor total): R$ ${formatBRL(totalToPay)}`, margin, 11);
  currentY += 16;
  drawText(`Total pago: R$ ${formatBRL(totalPaid)}`, margin, 11);
  currentY += 20;

  // Draw table headers
  const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor total", "Pgt", "Banco/PIX", "Status"];
  let currentX = margin;
  headers.forEach((headerText, index) => {
    drawText(headerText, currentX, 9);
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
  validRows.forEach((reportRow) => {
    const actionDate = reportRow?.actionId?.date
      ? formatDateBR(reportRow.actionId.date)
      : formatDateBR(reportRow?.reportDate);
    const clientName = reportRow?.actionId?.clientName || reportRow?.actionId?.client || '';
    const actionName = reportRow?.actionId?.name || '';
    const staffList = Array.isArray(reportRow?.actionId?.staff) ? reportRow.actionId.staff : [];
    const costsList = Array.isArray(reportRow?.actionId?.costs) ? reportRow.actionId.costs : [];
    const currentStatus = (reportRow?.status || 'ABERTO').toUpperCase();

    let cellX = margin;
    drawText(actionDate, cellX, 8.5);
    cellX += columnWidths[0];
    drawText(clipText(clientName, columnWidths[1], 8.5), cellX, 8.5);
    cellX += columnWidths[1];
    drawText(clipText(actionName, columnWidths[2], 8.5), cellX, 8.5);
    cellX += columnWidths[2];

    // Get staff or cost name
    let staffOrCostName = reportRow?.staffName || '';
    if (!staffOrCostName && reportRow?.costId) {
      const costItem = costsList.find(c => String(c._id) === String(reportRow.costId));
      if (costItem) {
        staffOrCostName = reportRow?.colaboradorLabel
          ? `${costItem.description || ''} - ${reportRow.colaboradorLabel}`
          : (costItem.description || '');
      }
    }
    drawText(clipText(staffOrCostName, columnWidths[3], 8.5), cellX, 8.5);
    cellX += columnWidths[3];

    const staffMember = staffList.find(s => s.name === reportRow?.staffName);
    const dueDate = formatDateBR(staffMember?.vencimento);
    drawText(dueDate, cellX, 8.5);
    cellX += columnWidths[4];

    const staffValue = (staffMember && typeof staffMember.value !== 'undefined')
      ? formatBRL(Number(staffMember.value))
      : '';
    drawText(staffValue, cellX, 8.5);
    cellX += columnWidths[5];

    const paymentType = staffMember?.pgt || '';
    drawText(clipText(paymentType, columnWidths[6], 8.5), cellX, 8.5);
    cellX += columnWidths[6];

    // Try to get PIX/Banco from colaboradorData first (attached by helper), then fall back to staffMember
    const bankOrPix = (paymentType === 'PIX')
      ? (reportRow?.colaboradorData?.pix || staffMember?.pix || '')
      : (paymentType === 'TED' ? (reportRow?.colaboradorData?.banco || staffMember?.bank || '') : '');
    drawText(clipText(bankOrPix, columnWidths[7], 8.5), cellX, 8.5);
    cellX += columnWidths[7];

    drawText(currentStatus, cellX, 8.5);

    // Draw row separator line
    page.drawLine({
      start: { x: margin, y: page.getHeight() - currentY - 2 },
      end: { x: pageWidth - margin, y: page.getHeight() - currentY - 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85)
    });
    currentY += rowHeight;
  });

  const pdfBytes = await pdfDocument.save();
  downloadPDFDocument(pdfBytes, 'custos-acoes.pdf');
}

/**
 * Generates a comprehensive PDF report for accounts payable (Contas a Pagar).
 * Includes both action costs and optional fixed accounts.
 * @param {object} params - Report parameters
 * @param {Array} params.rows - Action cost rows
 * @param {Array} params.fixasRows - Fixed accounts rows
 * @param {string} params.dueFrom - Start date filter (ISO format)
 * @param {string} params.dueTo - End date filter (ISO format)
 * @param {boolean} params.includeFixas - Whether to include fixed accounts section
 * @param {Function} params.getDisplayStatus - Function to get display status
 * @param {string} params.searchQuery - Search query filter
 * @param {string} params.statusFilter - Status filter (ALL, ABERTO, PAGO)
 */
export async function gerarContasAPagarPDF({ rows, fixasRows, dueFrom, dueTo, includeFixas, getDisplayStatus, searchQuery, statusFilter }) {
  const validActionRows = Array.isArray(rows) ? rows : [];
  const validFixedRows = Array.isArray(fixasRows) ? fixasRows : [];

  // When includeFixas is true, allow PDF generation even with no data (will show R$ 0,00)
  if (!includeFixas && !validActionRows.length && !validFixedRows.length) {
    throw new Error("Nenhum resultado para gerar o relatório");
  }

  // Determine date range for the report
  let firstDate = null;
  let lastDate = null;
  if (dueFrom || dueTo) {
    firstDate = dueFrom ? new Date(`${dueFrom}T00:00:00`) : null;
    lastDate = dueTo ? new Date(`${dueTo}T23:59:59`) : null;
  } else if (validActionRows.length) {
    firstDate = validActionRows[0]?.reportDate ? new Date(validActionRows[0].reportDate) : null;
    lastDate = validActionRows[validActionRows.length - 1]?.reportDate
      ? new Date(validActionRows[validActionRows.length - 1].reportDate)
      : null;
  } else if (validFixedRows.length) {
    const dueDateTimestamps = validFixedRows
      .map(account => account.vencimento ? new Date(account.vencimento).getTime() : null)
      .filter(Boolean);
    if (dueDateTimestamps.length) {
      dueDateTimestamps.sort((a, b) => a - b);
      firstDate = new Date(dueDateTimestamps[0]);
      lastDate = new Date(dueDateTimestamps[dueDateTimestamps.length - 1]);
    }
  }

  // Calculate totals for each section
  const { totalToPay: actionsToPay, totalPaid: actionsPaid, totalLines: actionLineCount } =
    calculateActionTotals(validActionRows);
  const { totalToPay: fixedToPay, totalPaid: fixedPaid } =
    calculateFixedAccountTotals(validFixedRows, getDisplayStatus);
  const grandTotalToPay = actionsToPay + (includeFixas ? fixedToPay : 0);

  const pdfDocument = await PDFDocument.create();
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const pageWidth = 900;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  const columnWidths = [70, 150, 150, 140, 90, 80, 50, 180, 80];

  // Calculate estimated page height
  const filterLineCount = [searchQuery, statusFilter, (dueFrom || dueTo)].filter(Boolean).length;
  const extraFilterHeight = filterLineCount > 0 ? filterLineCount * 14 + 8 : 0;
  const chartHeight = includeFixas ? 360 : 180; // Two charts if includeFixas, one otherwise

  let estimatedHeight = margin;
  estimatedHeight += 22; // title
  estimatedHeight += chartHeight; // charts
  estimatedHeight += 16; // period line
  estimatedHeight += extraFilterHeight; // filter lines
  estimatedHeight += 18; // overall total line
  estimatedHeight += 12; // gap
  estimatedHeight += 18; // 'Custos ações' label
  estimatedHeight += 36; // acoes totals
  estimatedHeight += headerHeight + Math.max(actionLineCount, 1) * rowHeight + 16; // acoes table + gap
  if (includeFixas) {
    estimatedHeight += 18; // 'Contas Fixas' label
    estimatedHeight += 36; // fixas totals
    estimatedHeight += headerHeight + Math.max(validFixedRows.length, 1) * rowHeight + 16; // fixas table
  }
  estimatedHeight += margin;
  const pageHeight = Math.max(500, estimatedHeight);
  const page = pdfDocument.addPage([pageWidth, pageHeight]);

  let currentY = margin;

  /**
   * Draws text at the specified position.
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

  const clipText = createTextClipper(font);

  // Draw title
  drawText("Contas a Pagar", margin, 16);
  currentY += 22;

  // Draw period
  const dateRange = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${dateRange}`, margin, 10);
  currentY += 16;

  // Draw active filters
  if (searchQuery) {
    drawText(`Busca: ${searchQuery}`, margin, 9);
    currentY += 14;
  }
  if (dueFrom || dueTo) {
    const fromDate = dueFrom ? formatDateBR(new Date(dueFrom)) : '-';
    const toDate = dueTo ? formatDateBR(new Date(dueTo)) : '-';
    drawText(`Filtro Vencimento: ${fromDate} até ${toDate}`, margin, 9);
    currentY += 14;
  }
  if (statusFilter && statusFilter !== 'ALL') {
    drawText(`Status: ${statusFilter}`, margin, 9);
    currentY += 14;
  }

  if (filterLineCount > 0) {
    currentY += 4; // Extra spacing after filters
  }

  // Draw grand total
  drawText(`Total geral a pagar (Valor total): R$ ${formatBRL(grandTotalToPay)}`, margin, 11);
  currentY += 22;

  // Actions section header
  drawText("Custos ações", margin, 12);
  currentY += 20;

  // Actions totals
  drawText(`Total a pagar (Valor total): R$ ${formatBRL(actionsToPay)}`, margin, 10);
  currentY += 16;
  drawText(`Total pago: R$ ${formatBRL(actionsPaid)}`, margin, 10);
  currentY += 16;

  // Actions table header
  {
    const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor total", "Pgt", "Banco/PIX", "Status"];
    let currentX = margin;
    headers.forEach((headerText, index) => {
      drawText(headerText, currentX, 9);
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
  }

  // Draw actions data rows
  validActionRows.forEach((reportRow) => {
    const actionDate = reportRow?.actionId?.date
      ? formatDateBR(reportRow.actionId.date)
      : formatDateBR(reportRow?.reportDate);
    const clientName = reportRow?.actionId?.clientName || reportRow?.actionId?.client || '';
    const actionName = reportRow?.actionId?.name || '';
    const staffList = Array.isArray(reportRow?.actionId?.staff) ? reportRow.actionId.staff : [];
    const costsList = Array.isArray(reportRow?.actionId?.costs) ? reportRow.actionId.costs : [];
    const currentStatus = (reportRow?.status || 'ABERTO').toUpperCase();

    let cellX = margin;
    drawText(actionDate, cellX, 8.5);
    cellX += columnWidths[0];
    drawText(clipText(clientName, columnWidths[1], 8.5), cellX, 8.5);
    cellX += columnWidths[1];
    drawText(clipText(actionName, columnWidths[2], 8.5), cellX, 8.5);
    cellX += columnWidths[2];

    // Get staff or cost name
    let staffOrCostName = reportRow?.staffName || '';
    if (!staffOrCostName && reportRow?.costId) {
      const costItem = costsList.find(c => String(c._id) === String(reportRow.costId));
      if (costItem) {
        staffOrCostName = reportRow?.colaboradorLabel
          ? `${costItem.description || ''} - ${reportRow.colaboradorLabel}`
          : (costItem.description || '');
      }
    }
    drawText(clipText(staffOrCostName, columnWidths[3], 8.5), cellX, 8.5);
    cellX += columnWidths[3];

    const staffMember = staffList.find(s => s.name === reportRow?.staffName);
    const dueDate = formatDateBR(staffMember?.vencimento);
    drawText(dueDate, cellX, 8.5);
    cellX += columnWidths[4];

    const staffValue = (staffMember && typeof staffMember.value !== 'undefined')
      ? formatBRL(Number(staffMember.value))
      : '';
    drawText(staffValue, cellX, 8.5);
    cellX += columnWidths[5];

    const paymentType = staffMember?.pgt || '';
    drawText(clipText(paymentType, columnWidths[6], 8.5), cellX, 8.5);
    cellX += columnWidths[6];

    // Try to get PIX/Banco from colaboradorData first (attached by helper), then fall back to staffMember
    const bankOrPix = (paymentType === 'PIX')
      ? (reportRow?.colaboradorData?.pix || staffMember?.pix || '')
      : (paymentType === 'TED' ? (reportRow?.colaboradorData?.banco || staffMember?.bank || '') : '');
    drawText(clipText(bankOrPix, columnWidths[7], 8.5), cellX, 8.5);
    cellX += columnWidths[7];

    drawText(currentStatus, cellX, 8.5);

    // Draw row separator line
    page.drawLine({
      start: { x: margin, y: page.getHeight() - currentY - 2 },
      end: { x: pageWidth - margin, y: page.getHeight() - currentY - 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85)
    });
    currentY += rowHeight;
  });

  // Fixed accounts section (optional)
  if (includeFixas) {
    currentY += 16;
    drawText("Contas Fixas", margin, 12);
    currentY += 20;

    // Fixed accounts totals
    drawText(`Total a pagar (Valor total): R$ ${formatBRL(fixedToPay)}`, margin, 10);
    currentY += 16;
    drawText(`Total pago: R$ ${formatBRL(fixedPaid)}`, margin, 10);
    currentY += 16;

    // Fixed accounts table header
    const fixedHeaders = ["Nome", "Empresa", "Tipo", "Valor total", "Vencimento", "Status", "Pago em"];
    const fixedColumnWidths = [160, 200, 100, 100, 120, 100, 120];
    let currentX = margin;
    fixedHeaders.forEach((headerText, index) => {
      drawText(headerText, currentX, 9);
      currentX += fixedColumnWidths[index];
    });

    // Draw header line
    page.drawLine({
      start: { x: margin, y: page.getHeight() - currentY - 4 },
      end: { x: pageWidth - margin, y: page.getHeight() - currentY - 4 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
    currentY += rowHeight;

    // Draw fixed accounts data rows
    validFixedRows.forEach((account) => {
      let cellX = margin;
      const paidOnDate = (getDisplayStatus?.(account) === 'PAGO' && account.lastPaidAt)
        ? formatMonthYearBR(account.lastPaidAt)
        : '';

      drawText(account?.name || '', cellX, 8.5);
      cellX += fixedColumnWidths[0];
      drawText(account?.empresa || '', cellX, 8.5);
      cellX += fixedColumnWidths[1];
      drawText(String(account?.tipo || '').toLowerCase(), cellX, 8.5);
      cellX += fixedColumnWidths[2];
      drawText(account?.valor != null ? formatBRL(Number(account.valor)) : '', cellX, 8.5);
      cellX += fixedColumnWidths[3];
      drawText(formatDateBR(account?.vencimento), cellX, 8.5);
      cellX += fixedColumnWidths[4];
      drawText(getDisplayStatus?.(account) || '', cellX, 8.5);
      cellX += fixedColumnWidths[5];
      drawText(paidOnDate, cellX, 8.5);

      // Draw row separator line
      page.drawLine({
        start: { x: margin, y: page.getHeight() - currentY - 2 },
        end: { x: pageWidth - margin, y: page.getHeight() - currentY - 2 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85)
      });
      currentY += rowHeight;
    });
  }

  const pdfBytes = await pdfDocument.save();
  downloadPDFDocument(pdfBytes, 'contas-a-pagar.pdf');
}

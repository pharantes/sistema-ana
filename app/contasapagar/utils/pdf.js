"use client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDateBR, formatMonthYearBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

export async function gerarPDFAcoes(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    globalThis.alert("Nenhum resultado para gerar o relatório");
    return;
  }
  const firstDate = safeRows[0]?.reportDate ? new Date(safeRows[0].reportDate) : null;
  const lastDate = safeRows[safeRows.length - 1]?.reportDate ? new Date(safeRows[safeRows.length - 1].reportDate) : null;

  let totalApagar = 0;
  let totalPago = 0;
  let totalLines = 0;
  for (const r of safeRows) {
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
  const measure = (t, size = 10) => font.widthOfTextAtSize(String(t ?? ''), size);
  const clip = (t, maxW, size = 10) => {
    const avail = Math.max(0, (maxW || 0) - 4);
    let s = String(t ?? '');
    if (!s) return '';
    if (measure(s, size) <= avail) return s;
    const ell = '…';
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (measure(s.slice(0, mid) + ell, size) <= avail) lo = mid; else hi = mid - 1;
    }
    return s.slice(0, lo) + ell;
  };
  // Title
  drawText("Custos ações", margin, 16);
  y += 22;
  const range = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${range}`, margin, 10);
  y += 16;
  // Totals
  drawText(`Total a pagar (Valor total): R$ ${formatBRL(totalApagar)}`, margin, 11);
  y += 16;
  drawText(`Total pago: R$ ${formatBRL(totalPago)}`, margin, 11);
  y += 20;

  // Headers
  const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor total", "Pgt", "Banco/PIX", "Status"];
  {
    let cx = margin;
    headers.forEach((h, i) => { drawText(h, cx, 9); cx += colWidths[i]; });
  }
  page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  y += rowHeight;

  safeRows.forEach((r) => {
    const data = r?.actionId?.date ? formatDateBR(r.actionId.date) : formatDateBR(r?.reportDate);
    const cliente = r?.actionId?.clientName || r?.actionId?.client || '';
    const acao = r?.actionId?.name || '';
    const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
    const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
    const status = (r?.status || 'ABERTO').toUpperCase();
    let cx = margin;
    drawText(data, cx, 8.5); cx += colWidths[0];
    drawText(clip(cliente, colWidths[1], 8.5), cx, 8.5); cx += colWidths[1];
    drawText(clip(acao, colWidths[2], 8.5), cx, 8.5); cx += colWidths[2];
    let sName = r?.staffName || '';
    if (!sName && r?.costId) {
      const ct = costs.find(c => String(c._id) === String(r.costId));
      if (ct) sName = r?.colaboradorLabel ? `${ct.description || ''} - ${r.colaboradorLabel}` : (ct.description || '');
    }
    drawText(clip(sName, colWidths[3], 8.5), cx, 8.5); cx += colWidths[3];
    const st = staff.find(s => s.name === r?.staffName);
    const venci = formatDateBR(st?.vencimento);
    drawText(venci, cx, 8.5); cx += colWidths[4];
    const sVal = (st && typeof st.value !== 'undefined') ? formatBRL(Number(st.value)) : '';
    drawText(sVal, cx, 8.5); cx += colWidths[5];
    const sPgt = st?.pgt || '';
    drawText(clip(sPgt, colWidths[6], 8.5), cx, 8.5); cx += colWidths[6];
    const disp = (sPgt === 'PIX') ? (st?.pix || '') : (sPgt === 'TED' ? (st?.bank || '') : '');
    drawText(clip(disp, colWidths[7], 8.5), cx, 8.5); cx += colWidths[7];
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

export async function gerarContasAPagarPDF({ rows, fixasRows, dueFrom, dueTo, includeFixas, getDisplayStatus }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeFixas = Array.isArray(fixasRows) ? fixasRows : [];
  if (!safeRows.length && !(includeFixas && safeFixas.length)) {
    globalThis.alert("Nenhum resultado para gerar o relatório");
    return;
  }
  let firstDate = null;
  let lastDate = null;
  if (dueFrom || dueTo) {
    firstDate = dueFrom ? new Date(`${dueFrom}T00:00:00`) : null;
    lastDate = dueTo ? new Date(`${dueTo}T23:59:59`) : null;
  } else if (safeRows.length) {
    firstDate = safeRows[0]?.reportDate ? new Date(safeRows[0].reportDate) : null;
    lastDate = safeRows[safeRows.length - 1]?.reportDate ? new Date(safeRows[safeRows.length - 1].reportDate) : null;
  } else if (safeFixas.length) {
    const dates = safeFixas.map(c => c.vencimento ? new Date(c.vencimento).getTime() : null).filter(Boolean);
    if (dates.length) {
      dates.sort((a, b) => a - b);
      firstDate = new Date(dates[0]);
      lastDate = new Date(dates[dates.length - 1]);
    }
  }

  let totalAcoesApagar = 0;
  let totalAcoesPago = 0;
  let totalLinesAcoes = 0;
  for (const r of safeRows) {
    const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
    const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
    const st = r?.staffName ? staff.find(s => s.name === r?.staffName) : null;
    const ct = (!r?.staffName && r?.costId) ? costs.find(c => String(c._id) === String(r.costId)) : null;
    const v = Number((st?.value ?? ct?.value) || 0);
    totalAcoesApagar += v;
    if ((r?.status || 'ABERTO').toUpperCase() === 'PAGO') totalAcoesPago += v;
    totalLinesAcoes += 1;
  }

  let totalFixasApagar = 0;
  let totalFixasPago = 0;
  for (const c of safeFixas) {
    const v = Number(c?.valor || 0);
    totalFixasApagar += v;
    if (getDisplayStatus?.(c) === 'PAGO') totalFixasPago += v;
  }
  const totalGeralApagar = totalAcoesApagar + (includeFixas ? totalFixasApagar : 0);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pageWidth = 900;
  const rowHeight = 18;
  const headerHeight = 28;
  const margin = 30;
  const colWidths = [70, 150, 150, 140, 90, 80, 50, 180, 80];
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
    estHeight += headerHeight + Math.max(safeFixas.length, 1) * rowHeight + 16; // fixas table
  }
  estHeight += margin;
  const pageHeight = Math.max(500, estHeight);
  const page = doc.addPage([pageWidth, pageHeight]);
  let y = margin;
  const drawText = (text, x, size = 10) => {
    page.drawText(String(text ?? ""), { x, y: page.getHeight() - y, size, font });
  };
  const measure = (t, size = 10) => font.widthOfTextAtSize(String(t ?? ''), size);
  const clip = (t, maxW, size = 10) => {
    const avail = Math.max(0, (maxW || 0) - 4);
    let s = String(t ?? '');
    if (!s) return '';
    if (measure(s, size) <= avail) return s;
    const ell = '…';
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (measure(s.slice(0, mid) + ell, size) <= avail) lo = mid; else hi = mid - 1;
    }
    return s.slice(0, lo) + ell;
  };

  // Title
  drawText("Contas a Pagar", margin, 16);
  y += 22;
  const range = `${formatDateBR(firstDate)} - ${formatDateBR(lastDate)}`;
  drawText(`Período: ${range}`, margin, 10);
  y += 12;
  drawText(`Total geral a pagar (Valor total): R$ ${formatBRL(totalGeralApagar)}`, margin, 11);
  y += 22;

  // Acoes section
  drawText("Custos ações", margin, 12);
  y += 20;
  drawText(`Total a pagar (Valor total): R$ ${formatBRL(totalAcoesApagar)}`, margin, 10);
  y += 16;
  drawText(`Total pago: R$ ${formatBRL(totalAcoesPago)}`, margin, 10);
  y += 16;
  {
    const headers = ["Data", "Cliente", "Ação", "Colaborador", "Vencimento", "Valor total", "Pgt", "Banco/PIX", "Status"];
    let cx = margin; headers.forEach((h, i) => { drawText(h, cx, 9); cx += colWidths[i]; });
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;
  }
  safeRows.forEach((r) => {
    const data = r?.actionId?.date ? formatDateBR(r.actionId.date) : formatDateBR(r?.reportDate);
    const cliente = r?.actionId?.clientName || r?.actionId?.client || '';
    const acao = r?.actionId?.name || '';
    const staff = Array.isArray(r?.actionId?.staff) ? r.actionId.staff : [];
    const costs = Array.isArray(r?.actionId?.costs) ? r.actionId.costs : [];
    const status = (r?.status || 'ABERTO').toUpperCase();
    let cx = margin;
    drawText(data, cx, 8.5); cx += colWidths[0];
    drawText(clip(cliente, colWidths[1], 8.5), cx, 8.5); cx += colWidths[1];
    drawText(clip(acao, colWidths[2], 8.5), cx, 8.5); cx += colWidths[2];
    let sName = r?.staffName || '';
    if (!sName && r?.costId) {
      const ct = costs.find(c => String(c._id) === String(r.costId));
      if (ct) sName = r?.colaboradorLabel ? `${ct.description || ''} - ${r.colaboradorLabel}` : (ct.description || '');
    }
    drawText(clip(sName, colWidths[3], 8.5), cx, 8.5); cx += colWidths[3];
    const st = staff.find(s => s.name === r?.staffName);
    const venci = formatDateBR(st?.vencimento);
    drawText(venci, cx, 8.5); cx += colWidths[4];
    const sVal = (st && typeof st.value !== 'undefined') ? formatBRL(Number(st.value)) : '';
    drawText(sVal, cx, 8.5); cx += colWidths[5];
    const sPgt = st?.pgt || '';
    drawText(clip(sPgt, colWidths[6], 8.5), cx, 8.5); cx += colWidths[6];
    const disp = (sPgt === 'PIX') ? (st?.pix || '') : (sPgt === 'TED' ? (st?.bank || '') : '');
    drawText(clip(disp, colWidths[7], 8.5), cx, 8.5); cx += colWidths[7];
    drawText(status, cx, 8.5);
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 2 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    y += rowHeight;
  });

  if (includeFixas) {
    y += 16;
    drawText("Contas Fixas", margin, 12);
    y += 20;
    drawText(`Total a pagar (Valor total): R$ ${formatBRL(totalFixasApagar)}`, margin, 10);
    y += 16;
    drawText(`Total pago: R$ ${formatBRL(totalFixasPago)}`, margin, 10);
    y += 16;
    const headers = ["Nome", "Empresa", "Tipo", "Valor total", "Vencimento", "Status", "Pago em"];
    const fixasWidths = [160, 200, 100, 100, 120, 100, 120];
    let cx = margin; headers.forEach((h, i) => { drawText(h, cx, 9); cx += fixasWidths[i]; });
    page.drawLine({ start: { x: margin, y: page.getHeight() - y - 4 }, end: { x: pageWidth - margin, y: page.getHeight() - y - 4 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y += rowHeight;
    safeFixas.forEach((c) => {
      let cx2 = margin;
      const pagoEm = (getDisplayStatus?.(c) === 'PAGO' && c.lastPaidAt) ? formatMonthYearBR(c.lastPaidAt) : '';
      drawText(c?.name || '', cx2, 8.5); cx2 += fixasWidths[0];
      drawText(c?.empresa || '', cx2, 8.5); cx2 += fixasWidths[1];
      drawText(String(c?.tipo || '').toLowerCase(), cx2, 8.5); cx2 += fixasWidths[2];
      drawText(c?.valor != null ? formatBRL(Number(c.valor)) : '', cx2, 8.5); cx2 += fixasWidths[3];
      drawText(formatDateBR(c?.vencimento), cx2, 8.5); cx2 += fixasWidths[4];
      drawText(getDisplayStatus?.(c) || '', cx2, 8.5); cx2 += fixasWidths[5];
      drawText(pagoEm, cx2, 8.5);
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

/**
 * @fileoverview Column definitions for action tables and PDF reports.
 * Defines column configurations for UI tables and PDF generation with proper ordering and widths.
 */

/**
 * Column definitions for the actions list table (UI only).
 * Order: Criado em, Evento, Início, Fim, Cliente
 * @type {Array<{key: string, label: string}>}
 */
export const actionListColumns = [
  { key: "date", label: "Criado em" },
  { key: "event", label: "Evento" },
  { key: "start", label: "Início" },
  { key: "end", label: "Fim" },
  { key: "client", label: "Cliente" },
];

/**
 * Column definitions for PDF reports.
 * Order: Criado em, Evento, Início, Fim, Cliente, Profissional, Valor, Vencimento, PIX, Pgt, Banco
 * @type {Array<{key: string, label: string}>}
 */
export const actionReportColumns = [
  { key: "date", label: "Criado em" },
  { key: "event", label: "Evento" },
  { key: "start", label: "Início" },
  { key: "end", label: "Fim" },
  { key: "client", label: "Cliente" },
  { key: "staff", label: "Profissional" },
  { key: "value", label: "Valor" },
  { key: "due", label: "Vencimento" },
  { key: "pix", label: "PIX" },
  { key: "pgt", label: "Pgt" },
  { key: "bank", label: "Banco" },
];

/**
 * Column widths for PDF report generation (in points, A4 landscape format).
 * @type {Object<string, number>}
 */
export const actionReportWidths = {
  date: 55,
  event: 80,
  start: 55,
  end: 55,
  client: 100,
  staff: 120,
  value: 50,
  due: 60,
  pix: 70,
  pgt: 50,
  bank: 40,
};

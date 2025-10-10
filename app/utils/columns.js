// Columns for the actions LIST TABLE (UI only)
// Order: Criado em, Evento, Início, Fim, Cliente
export const actionListColumns = [
  { key: "date", label: "Criado em" },
  { key: "event", label: "Evento" },
  { key: "start", label: "Início" },
  { key: "end", label: "Fim" },
  { key: "client", label: "Cliente" },
];

// Columns for the PDF REPORT
// Order: Criado em, Evento, Início, Fim, Cliente, Profissional, Valor, Vencimento, PIX, Pgt, Banco
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

// Widths used by the PDF generator (in points, A4 landscape) for report
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

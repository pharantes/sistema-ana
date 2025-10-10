// Utilities to handle pt-BR currency formatting and parsing consistently across the app

export function formatBRL(value) {
  if (value == null || value === '') return '';
  const n = Number(String(value).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

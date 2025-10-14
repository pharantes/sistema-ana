// Utilities to handle pt-BR currency formatting and parsing consistently across the app

export function formatBRL(value) {
  if (value == null || value === '') return '';
  // Normalize using the same logic as parseCurrency so we format consistently
  const n = parseCurrency(value);
  if (n == null) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;

  // Keep only digits and separators
  const s = String(value).trim().replace(/[^0-9.,-]/g, '');
  if (!s) return undefined;

  // Find last separator (comma or dot) — treat it as decimal separator
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const sepIndex = Math.max(lastComma, lastDot);

  let normalized;
  if (sepIndex > -1) {
    const intPart = s.slice(0, sepIndex).replace(/[^0-9-]/g, '');
    const decPart = s.slice(sepIndex + 1).replace(/[^0-9]/g, '');
    normalized = intPart + (decPart ? '.' + decPart : '');
  } else {
    // No separators, just digits
    normalized = s.replace(/[^0-9-]/g, '');
  }

  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

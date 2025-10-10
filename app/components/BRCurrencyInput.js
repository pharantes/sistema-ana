"use client";
/* eslint-env browser */
import * as FE from './FormElements';
import { formatBRL, parseCurrency } from '../utils/currency';

// A controlled input for BRL with a consistent UX:
// - Displays formatted (1.234,56)
// - On focus switches to raw numeric string (e.g., 1234.56)
// - On change bubbles the raw string so parents can decide when to parse
// - On blur re-applies BRL formatting
// Props: value (string|number), onChange(rawString), onBlur?
export default function BRCurrencyInput({ value, onChange, onBlur, ...rest }) {
  const str = String(value ?? '');
  const handleFocus = (e) => {
    const raw = String(str).replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
    e.target.value = raw;
    try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch { /* noop */ }
  };
  const handleChange = (e) => {
    onChange && onChange(e.target.value);
  };
  const handleBlur = (e) => {
    const n = parseCurrency(e.target.value);
    const fmt = formatBRL(n);
    e.target.value = fmt;
    onChange && onChange(fmt);
    onBlur && onBlur(e);
  };
  return (
    <FE.Input
      type="text"
      inputMode="decimal"
      value={formatBRL(parseCurrency(str))}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="R$"
      {...rest}
    />
  );
}

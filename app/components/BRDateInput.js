"use client";
/* eslint-env browser */
// Reusable date input for Brazilian format typing/display (dd/MM/aaaa) while keeping ISO (yyyy-MM-dd) in state
// Props:
// - value: ISO string (yyyy-MM-dd) or ''
// - onChange: function(nextISO)
// - placeholder: optional placeholder (defaults to dd/mm/aaaa)
// - style, className, id, name, disabled, required, ...rest
import { useMemo } from 'react';

function isoToBR(iso) {
  if (!iso) return '';
  // Expect yyyy-MM-dd
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function brToISO(br) {
  if (!br) return '';
  const only = String(br).replace(/[^0-9]/g, '').slice(0, 8);
  if (only.length < 8) return '';
  const dd = only.slice(0, 2);
  const mm = only.slice(2, 4);
  const yyyy = only.slice(4, 8);
  // basic sanity: month 01-12, day 01-31
  const mi = Number(mm), di = Number(dd);
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return '';
  return `${yyyy}-${mm}-${dd}`;
}

function maskBR(s) {
  const only = String(s || '').replace(/[^0-9]/g, '').slice(0, 8);
  const p1 = only.slice(0, 2);
  const p2 = only.slice(2, 4);
  const p3 = only.slice(4, 8);
  let out = p1;
  if (p2) out += (out ? '/' : '') + p2;
  if (p3) out += (out ? '/' : '') + p3;
  return out;
}

export default function BRDateInput({ value, onChange, placeholder = 'dd/mm/aaaa', onBlur, ...rest }) {
  const display = useMemo(() => isoToBR(value || ''), [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={(e) => {
        const masked = maskBR(e.target.value);
        e.target.value = masked; // keep masked in the field
        // convert to ISO when we have full 8 digits; otherwise pass '' to clear
        const iso = brToISO(masked);
        onChange && onChange(iso);
      }}
      onBlur={(e) => {
        // normalize on blur; if incomplete, clear
        const iso = brToISO(e.target.value);
        if (!iso) {
          onChange && onChange('');
          e.target.value = '';
        }
        onBlur && onBlur(e);
      }}
      {...rest}
    />
  );
}

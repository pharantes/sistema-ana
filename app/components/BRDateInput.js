"use client";
/* eslint-env browser */
// Reusable date input for Brazilian format typing/display (dd/MM/aaaa) while keeping ISO (yyyy-MM-dd) in state
// Also preserves native date picker via a calendar button that opens a hidden <input type="date">.
// Props:
// - value: ISO string (yyyy-MM-dd) or ''
// - onChange: function(nextISO)
// - placeholder: optional placeholder (defaults to dd/mm/aaaa)
// - style, className, id, name, disabled, required, ...rest
import { useMemo, useRef } from 'react';
import * as FE from './FormElements';

function isoToBR(iso) {
  if (!iso) return '';
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

export default function BRDateInput({ value, onChange, placeholder = 'dd/mm/aaaa', onBlur, style, className, disabled, ...rest }) {
  const display = useMemo(() => isoToBR(value || ''), [value]);
  const dateRef = useRef(null);
  const mergedStyle = { ...(style || {}), paddingRight: 40 };

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      {/* Visible styled text input with BR mask */}
      <FE.Input
        as="input"
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        disabled={disabled}
        onChange={(e) => {
          const masked = maskBR(e.target.value);
          e.target.value = masked; // keep masked in the field
          const iso = brToISO(masked);
          onChange && onChange(iso);
        }}
        onBlur={(e) => {
          const iso = brToISO(e.target.value);
          if (!iso) {
            onChange && onChange('');
            e.target.value = '';
          }
          onBlur && onBlur(e);
        }}
        style={mergedStyle}
        {...rest}
      />

      {/* Calendar button to open native picker */}
      <button
        type="button"
        aria-label="Abrir calendário"
        onClick={() => {
          try { dateRef.current?.showPicker?.(); } catch { /* noop */ }
          try { if (!dateRef.current?.showPicker) dateRef.current?.focus?.(); } catch { /* noop */ }
        }}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: 6,
          top: 6,
          bottom: 6,
          width: 32,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 6,
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#555'
        }}
      >📅</button>

      {/* Hidden native date input to drive the picker */}
      <input
        ref={dateRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        disabled={disabled}
      />
    </div>
  );
}

"use client";
/* eslint-env browser */
// Reusable date input for Brazilian format typing/display (dd/MM/aaaa) while keeping ISO (yyyy-MM-dd) in state
// Also preserves native date picker via a calendar button that opens a hidden <input type="date">.
// Props:
// - value: ISO string (yyyy-MM-dd) or ''
// - onChange: function(nextISO)
// - placeholder: optional placeholder (defaults to dd/mm/aaaa)
// - style, className, id, name, disabled, required, ...rest
import { useRef, useState, useEffect } from 'react';
// removed unused FE import

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

export default function BRDateInput({ value, onChange, placeholder = 'dd/mm/aaaa', onBlur, className, disabled, ...rest }) {
  const dateRef = useRef(null);
  const rootRef = useRef(null);
  const [isInDialog, setIsInDialog] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [display, setDisplay] = useState(() => isoToBR(value || ''));

  // keep display in sync when value prop changes, but don't stomp while editing
  useEffect(() => {
    if (isFocused) return;
    setDisplay(isoToBR(value || ''));
  }, [value, isFocused]);

  // replace inline merged style with a local styled input to avoid style={...}

  useEffect(() => {
    try {
      const root = rootRef.current;
      if (!root) return;
      const dialog = root.closest && root.closest('[role="dialog"]');
      setIsInDialog(!!dialog);
    } catch { /* noop */ }
  }, []);

  return (
    <Root className={className} ref={rootRef}>
      {/* Visible styled text input with BR mask */}
      <PaddedInput
        as="input"
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        disabled={disabled}
        onFocus={(e) => {
          setIsFocused(true);
          // keep caret at end
          setTimeout(() => { try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch (err) { void err; } }, 0);
        }}
        onChange={(e) => {
          const masked = maskBR(e.target.value);
          setDisplay(masked);
          const iso = brToISO(masked);
          // only notify parent when we have a full ISO (complete date)
          if (iso) onChange && onChange(iso);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          const iso = brToISO(display);
          if (!iso) {
            onChange && onChange('');
            setDisplay('');
          } else {
            // ensure parent has the final ISO
            onChange && onChange(iso);
            setDisplay(isoToBR(iso));
          }
          onBlur && onBlur(e);
        }}

        {...rest}
      />

      {/* Calendar button to open native picker */}
      <CalendarButton
        type="button"
        aria-label="Abrir calendário"
        data-in-dialog={isInDialog ? 'true' : 'false'}
        onClick={() => {
          try { dateRef.current?.showPicker?.(); } catch { /* noop */ }
          try { if (!dateRef.current?.showPicker) dateRef.current?.focus?.(); } catch { /* noop */ }
        }}
        disabled={disabled}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style={{ width: '18px', height: '18px' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="1.6" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.6" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.6" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </CalendarButton>

      {/* Hidden native date input to drive the picker */}
      <HiddenDate
        ref={dateRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
      />
    </Root>
  );
}

import styled from 'styled-components';

const Root = styled.div`
  display: inline-flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-width: 140px;
  position: relative; /* allow absolute positioning of the calendar button so it sits inside the input */
  overflow: visible; /* ensure the calendar button isn't clipped by ancestor overflow */
`;

const CalendarButton = styled.button`
  appearance: none !important;
  -webkit-appearance: none !important;
  border: none !important;
  background: transparent !important; /* ensure no inherited grey background */
  padding: 0 !important;
  width: 36px !important;
  height: calc(var(--control-height, 36px) - 4px) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--color-primary, #2563eb) !important;
  cursor: pointer !important;
  flex: 0 0 auto !important;
  margin-left: 0 !important;
  position: absolute !important; /* place the button inside the input's right edge */
  right: 8px !important;
  top: 50% !important;
  transform: translateY(-50%) !important; /* precisely center vertically */
  line-height: 1 !important;
  font-size: 14px !important; /* smaller to match baseline */
  border-radius: 6px !important;
  /* Ensure the button is visually above modal input backgrounds */
  z-index: 9999 !important;
  &:hover { background: transparent !important; }
  &:disabled { cursor: not-allowed !important; opacity: 0.6 !important; }
  &:focus { outline: none !important; box-shadow: none !important; }
  svg { width: 18px !important; height: 18px !important; display: block !important; stroke: var(--color-primary, #2563eb) !important; fill: none !important; stroke-linecap: round; stroke-linejoin: round; }
  &[data-in-dialog="true"] {
    transform: translateY(calc(-50% - 4px)) !important;
  }
`;

const HiddenDate = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

// local padded input to avoid inline style prop
const PaddedInput = styled.input`
  /* reset inherited element styles (modal input rules) so this control is self-contained */
  all: unset;
  box-sizing: border-box;
  display: inline-block;
  padding-right: calc(36px + 8px) !important; /* space for fixed calendar button + gap */
  padding-left: var(--space-xs, 8px) !important;
  padding-top: calc(var(--space-xxs, 4px) + 2px) !important;
  padding-bottom: calc(var(--space-xxs, 4px) + 2px) !important;
  height: var(--control-height, 36px) !important;
  width: 100% !important;
  min-width: 120px !important;
  background: var(--color-surface, #fff) !important;
  border: 1px solid var(--color-border, #e5e7eb) !important;
  border-radius: var(--radius-sm, 6px) !important;
  position: relative;
  z-index: 0;
  font: inherit !important;
  color: inherit !important;
  flex: 1 1 auto;
  &::placeholder { color: #9ca3af; }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.06);
  }
`;

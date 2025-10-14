"use client";
/* eslint-env browser */
import * as FE from './FormElements';
import { formatBRL, parseCurrency } from '../utils/currency';
import { useState, useEffect, useRef } from 'react';

// Controlled currency input that normalizes value as a Number via onChange.
// - Accepts `value` as number or formatted string.
// - Calls onChange(number|undefined) whenever the input changes or blurs.
// - Shows a formatted string when blurred, and raw numeric on focus.
export default function BRCurrencyInput({ value, onChange, onBlur, ...rest }) {
  const [display, setDisplay] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // keep display in sync when value prop changes from outside
  useEffect(() => {
    // Don't overwrite the user's ongoing edit while focused.
    if (isFocused) return;

    if (value == null || value === '') {
      setDisplay('');
    } else if (typeof value === 'number') {
      setDisplay(formatBRL(value));
    } else {
      // if string, try to parse then format
      const n = parseCurrency(value);
      setDisplay(n == null ? '' : formatBRL(n));
    }
  }, [value, isFocused]);

  // Format a raw input string while the user is typing so they can see
  // thousands separators and the decimal comma for readability.
  const formatWhileTyping = (raw) => {
    if (raw == null) return '';
    const s = String(raw);
    // Extract only digits (ignore separators). Treat input as typed digits representing cents
    const digitsOnly = s.replace(/\D/g, '');
    if (!digitsOnly) return '';

    // Remove leading zeros for processing but preserve when result would be empty
    let trimmed = digitsOnly.replace(/^0+/, '');
    if (trimmed === '') trimmed = digitsOnly;

    const sign = s.trim().startsWith('-') ? '-' : '';

    if (trimmed.length <= 2) {
      const cents = trimmed.padStart(2, '0').slice(0, 2);
      return `0,${cents}`;
    }

    const intPartRaw = trimmed.slice(0, trimmed.length - 2);
    const decPartRaw = trimmed.slice(-2);

    // Group thousands using '.' as in pt-BR (safe implementation)
    const rev = intPartRaw.split('').reverse();
    const parts = [];
    for (let i = 0; i < rev.length; i += 3) {
      parts.push(rev.slice(i, i + 3).reverse().join(''));
    }
    const grouped = parts.reverse().join('.');
    const displayInt = sign + grouped;
    return `${displayInt},${decPartRaw}`;
  };

  const inputRef = useRef(null);

  const handleFocus = (e) => {
    setIsFocused(true);
    // expose a formatted-but-editable string while editing so the user
    // sees thousands separators and any decimal digits they typed
    const raw = display || (typeof value === 'number' ? String(value) : String(value || ''));
    setDisplay(formatWhileTyping(raw));
    // place caret at end after React updates
    setTimeout(() => {
      try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch { /* ignore */ }
    }, 0);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    // keep a human-friendly format while editing
    setDisplay(formatWhileTyping(v));
    const n = parseCurrency(v);
    onChange && onChange(n);
    // keep caret at the end for better UX after formatting
    setTimeout(() => {
      try { if (inputRef.current) inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length; } catch { /* ignore */ }
    }, 0);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    const n = parseCurrency(display);
    setDisplay(n == null ? '' : formatBRL(n));
    onChange && onChange(n);
    onBlur && onBlur(e);
  };

  return (
    <FE.Input
      type="text"
      inputMode="decimal"
      ref={inputRef}
      value={display}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="R$"
      {...rest}
    />
  );
}

"use client";
/* eslint-env browser */
import * as FE from './FormElements';
import { formatBRL, parseCurrency } from '../utils/currency';
import { useState, useEffect, useRef } from 'react';

/**
 * Extracts only digits from a string
 * @param {string} text - Input text
 * @returns {string} Digits only
 */
function extractDigits(text) {
  return String(text).replace(/\D/g, '');
}

/**
 * Groups integer part with thousands separator (pt-BR format)
 * @param {string} integerPart - Integer part to group
 * @returns {string} Grouped integer with '.' separator
 */
function groupThousands(integerPart) {
  const reversedDigits = integerPart.split('').reverse();
  const groups = [];

  for (let i = 0; i < reversedDigits.length; i += 3) {
    const group = reversedDigits.slice(i, i + 3).reverse().join('');
    groups.push(group);
  }

  return groups.reverse().join('.');
}

/**
 * Formats currency value while user is typing (pt-BR format with live feedback)
 * @param {string} rawInput - Raw input string
 * @returns {string} Formatted currency string
 */
function formatWhileTyping(rawInput) {
  if (rawInput == null) return '';

  const inputString = String(rawInput);
  const digitsOnly = extractDigits(inputString);

  if (!digitsOnly) return '';

  // Preserve leading zeros only if result would be empty
  let trimmedDigits = digitsOnly.replace(/^0+/, '');
  if (trimmedDigits === '') trimmedDigits = digitsOnly;

  const isNegative = inputString.trim().startsWith('-');
  const signPrefix = isNegative ? '-' : '';

  // Handle cents-only values (2 digits or less)
  if (trimmedDigits.length <= 2) {
    const centsPart = trimmedDigits.padStart(2, '0').slice(0, 2);
    return `0,${centsPart}`;
  }

  // Split into integer and decimal parts
  const integerPart = trimmedDigits.slice(0, trimmedDigits.length - 2);
  const decimalPart = trimmedDigits.slice(-2);

  const groupedInteger = groupThousands(integerPart);
  const formattedInteger = signPrefix + groupedInteger;

  return `${formattedInteger},${decimalPart}`;
}

/**
 * Moves cursor to end of input field
 * @param {HTMLInputElement} inputElement - Input element
 */
function moveCursorToEnd(inputElement) {
  setTimeout(() => {
    try {
      if (inputElement) {
        inputElement.selectionStart = inputElement.selectionEnd = inputElement.value.length;
      }
    } catch {
      // Ignore errors (e.g., input not focused)
    }
  }, 0);
}

/**
 * Controlled currency input that normalizes value as a Number via onChange.
 * - Accepts `value` as number or formatted string.
 * - Calls onChange(number|undefined) whenever the input changes or blurs.
 * - Shows a formatted string when blurred, and raw numeric on focus.
 * @param {Object} props - Component props
 * @param {number|string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 */
export default function BRCurrencyInput({ value, onChange, onBlur, ...rest }) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Keep display in sync when value prop changes from outside
  useEffect(() => {
    // Don't overwrite the user's ongoing edit while focused
    if (isFocused) return;

    if (value == null || value === '') {
      setDisplayValue('');
    } else if (typeof value === 'number') {
      setDisplayValue(formatBRL(value));
    } else {
      // If string, try to parse then format
      const parsedNumber = parseCurrency(value);
      setDisplayValue(parsedNumber == null ? '' : formatBRL(parsedNumber));
    }
  }, [value, isFocused]);

  const handleFocus = (e) => {
    setIsFocused(true);
    // Expose a formatted-but-editable string while editing so the user
    // sees thousands separators and any decimal digits they typed
    const rawValue = displayValue || (typeof value === 'number' ? String(value) : String(value || ''));
    setDisplayValue(formatWhileTyping(rawValue));
    // Place caret at end after React updates
    moveCursorToEnd(e.target);
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Keep a human-friendly format while editing
    setDisplayValue(formatWhileTyping(inputValue));
    const parsedNumber = parseCurrency(inputValue);
    if (onChange) onChange(parsedNumber);
    // Keep caret at the end for better UX after formatting
    moveCursorToEnd(inputRef.current);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    const parsedNumber = parseCurrency(displayValue);
    setDisplayValue(parsedNumber == null ? '' : formatBRL(parsedNumber));
    if (onChange) onChange(parsedNumber);
    if (onBlur) onBlur(e);
  };

  return (
    <FE.Input
      type="text"
      inputMode="decimal"
      ref={inputRef}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="R$"
      {...rest}
    />
  );
}

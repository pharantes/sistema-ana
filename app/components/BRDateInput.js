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

/**
 * Converts ISO date format (yyyy-MM-dd) to Brazilian format (dd/MM/yyyy)
 * @param {string} isoDate - ISO formatted date string
 * @returns {string} Brazilian formatted date string
 */
function isoToBR(isoDate) {
  if (!isoDate) return '';
  const dateMatch = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return '';
  return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
}

/**
 * Validates month and day values for date conversion
 * @param {number} month - Month value
 * @param {number} day - Day value
 * @returns {boolean} Whether the values are valid
 */
function isValidMonthAndDay(month, day) {
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * Converts Brazilian format (dd/MM/yyyy) to ISO date format (yyyy-MM-dd)
 * @param {string} brDate - Brazilian formatted date string
 * @returns {string} ISO formatted date string or empty if invalid
 */
function brToISO(brDate) {
  if (!brDate) return '';
  const digitsOnly = String(brDate).replace(/[^0-9]/g, '').slice(0, 8);
  if (digitsOnly.length < 8) return '';

  const dayPart = digitsOnly.slice(0, 2);
  const monthPart = digitsOnly.slice(2, 4);
  const yearPart = digitsOnly.slice(4, 8);

  const monthNumber = Number(monthPart);
  const dayNumber = Number(dayPart);

  if (!isValidMonthAndDay(monthNumber, dayNumber)) return '';

  return `${yearPart}-${monthPart}-${dayPart}`;
}

/**
 * Applies Brazilian date mask (dd/MM/yyyy) to input string
 * @param {string} input - Raw input string
 * @returns {string} Masked date string
 */
function maskBR(input) {
  const digitsOnly = String(input || '').replace(/[^0-9]/g, '').slice(0, 8);
  const dayPart = digitsOnly.slice(0, 2);
  const monthPart = digitsOnly.slice(2, 4);
  const yearPart = digitsOnly.slice(4, 8);

  let maskedOutput = dayPart;
  if (monthPart) maskedOutput += (maskedOutput ? '/' : '') + monthPart;
  if (yearPart) maskedOutput += (maskedOutput ? '/' : '') + yearPart;
  return maskedOutput;
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
      // Ignore errors
    }
  }, 0);
}

/**
 * Attempts to open the native date picker
 * @param {HTMLInputElement} dateInput - Date input element
 */
function openNativePicker(dateInput) {
  try {
    dateInput?.showPicker?.();
  } catch {
    // Fallback to focus if showPicker not available
    try {
      if (!dateInput?.showPicker) {
        dateInput?.focus?.();
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Brazilian date input component with native picker support
 * Displays dates in dd/MM/yyyy format while maintaining ISO format internally
 * @param {Object} props - Component props
 * @param {string} props.value - ISO date string (yyyy-MM-dd)
 * @param {Function} props.onChange - Change callback with ISO date
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onBlur - Blur callback
 * @param {string} props.className - CSS class name
 * @param {boolean} props.disabled - Whether input is disabled
 */
export default function BRDateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  onBlur,
  className,
  disabled,
  ...rest
}) {
  const datePickerRef = useRef(null);
  const rootRef = useRef(null);
  const [isInDialog, setIsInDialog] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => isoToBR(value || ''));

  // Keep display in sync when value prop changes, but don't stomp while editing
  useEffect(() => {
    if (isFocused) return;
    setDisplayValue(isoToBR(value || ''));
  }, [value, isFocused]);

  // Detect if input is inside a modal dialog
  useEffect(() => {
    try {
      const rootElement = rootRef.current;
      if (!rootElement) return;
      const dialogElement = rootElement.closest && rootElement.closest('[role="dialog"]');
      setIsInDialog(!!dialogElement);
    } catch {
      // Ignore errors
    }
  }, []);

  const handleFocus = (e) => {
    setIsFocused(true);
    moveCursorToEnd(e.target);
  };

  const handleChange = (e) => {
    const maskedValue = maskBR(e.target.value);
    setDisplayValue(maskedValue);
    const isoDate = brToISO(maskedValue);
    // Only notify parent when we have a full ISO (complete date)
    if (isoDate && onChange) {
      onChange(isoDate);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    const isoDate = brToISO(displayValue);

    if (!isoDate) {
      if (onChange) onChange('');
      setDisplayValue('');
    } else {
      // Ensure parent has the final ISO
      if (onChange) onChange(isoDate);
      setDisplayValue(isoToBR(isoDate));
    }

    if (onBlur) onBlur(e);
  };

  const handleCalendarClick = () => {
    openNativePicker(datePickerRef.current);
  };

  const handleNativePickerChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  return (
    <Root className={className} ref={rootRef}>
      {/* Visible styled text input with BR mask */}
      <PaddedInput
        as="input"
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        {...rest}
      />

      {/* Calendar button to open native picker */}
      <CalendarButton
        type="button"
        aria-label="Abrir calendário"
        data-in-dialog={isInDialog ? 'true' : 'false'}
        onClick={handleCalendarClick}
        disabled={disabled}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
          style={{ width: '18px', height: '18px' }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="1.6" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.6" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.6" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </CalendarButton>

      {/* Hidden native date input to drive the picker */}
      <HiddenDate
        ref={datePickerRef}
        type="date"
        value={value || ''}
        onChange={handleNativePickerChange}
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

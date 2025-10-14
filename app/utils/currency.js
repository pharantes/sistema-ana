/**
 * Checks if a value is empty (null, undefined, or empty string).
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
function isEmptyValue(value) {
  return value == null || value === '';
}

/**
 * Extracts only digits and valid separators from a value string.
 * @param {string} valueString - String to extract from
 * @returns {string} String containing only digits and separators (.,-)
 */
function extractDigitsAndSeparators(valueString) {
  return String(valueString).trim().replace(/[^0-9.,-]/g, '');
}

/**
 * Finds the index of the decimal separator (comma or dot).
 * Returns the position of the last comma or dot, whichever appears last.
 * @param {string} valueString - String to search
 * @returns {number} Index of decimal separator, or -1 if none found
 */
function findDecimalSeparatorIndex(valueString) {
  const lastCommaIndex = valueString.lastIndexOf(',');
  const lastDotIndex = valueString.lastIndexOf('.');
  return Math.max(lastCommaIndex, lastDotIndex);
}

/**
 * Normalizes a currency string to a float-parseable format.
 * Separates integer and decimal parts and formats with dot decimal separator.
 * @param {string} valueString - Currency string to normalize
 * @returns {string} Normalized string ready for parseFloat
 */
function normalizeToFloat(valueString) {
  const separatorIndex = findDecimalSeparatorIndex(valueString);

  if (separatorIndex > -1) {
    const integerPart = valueString.slice(0, separatorIndex).replace(/[^0-9-]/g, '');
    const decimalPart = valueString.slice(separatorIndex + 1).replace(/[^0-9]/g, '');
    return integerPart + (decimalPart ? '.' + decimalPart : '');
  }

  return valueString.replace(/[^0-9-]/g, '');
}

/**
 * Parses a currency value from various formats (string, number) to a numeric value.
 * Handles Brazilian format (1.234,56) and international format (1,234.56).
 * @param {string|number} value - Value to parse
 * @returns {number|undefined} Parsed numeric value, or undefined if invalid
 */
export function parseCurrency(value) {
  if (isEmptyValue(value)) return undefined;
  if (typeof value === 'number') return value;

  const cleanedValue = extractDigitsAndSeparators(value);
  if (!cleanedValue) return undefined;

  const normalized = normalizeToFloat(cleanedValue);
  const parsedNumber = parseFloat(normalized);

  return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
}

/**
 * Formats a numeric value as Brazilian Real currency (pt-BR format).
 * Returns formatted string like "1.234,56" or empty string for invalid values.
 * @param {string|number} value - Value to format
 * @returns {string} Formatted currency string or empty string if invalid
 */
export function formatBRL(value) {
  if (isEmptyValue(value)) return '';

  const numericValue = parseCurrency(value);
  if (numericValue == null) return '';

  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

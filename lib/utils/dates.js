function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

function toDate(input) {
  return input instanceof Date ? input : new Date(input);
}

/**
 * Parses a value into a Date object if possible, returns undefined otherwise.
 * Handles ISO date strings (YYYY-MM-DD) by setting time to noon UTC.
 */
export function parseDateMaybe(value) {
  if (!value) return undefined;

  const dateString = String(value);
  const isISOFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

  if (isISOFormat) {
    return new Date(`${dateString}T12:00:00`);
  }

  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? undefined : parsedDate;
}

/**
 * Creates a MongoDB query range for a single day (midnight to midnight).
 */
export function sameDayRange(date) {
  if (!isValidDate(date)) return null;

  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return { $gte: startOfDay, $lt: endOfDay };
}

/**
 * Formats a date in Brazilian format (DD/MM/YYYY).
 */
export function formatDateBR(input) {
  if (!input) return '';

  const date = toDate(input);
  return isNaN(date) ? '' : date.toLocaleDateString('pt-BR');
}

/**
 * Formats a date and time in Brazilian format (DD/MM/YYYY HH:MM:SS).
 */
export function formatDateTimeBR(input) {
  if (!input) return '';

  const date = toDate(input);
  return isNaN(date) ? '' : date.toLocaleString('pt-BR');
}

/**
 * Formats a date as month and year in Brazilian format (e.g., "jan. de 2024").
 */
export function formatMonthYearBR(input) {
  if (!input) return '';

  const date = toDate(input);
  return isNaN(date) ? '' : date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric'
  });
}

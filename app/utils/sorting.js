/**
 * Shared sorting utilities for tables across the application
 */

/**
 * Generic sort function that works with any array of objects
 * @param {Array} items - Array of items to sort
 * @param {Function} getSortValue - Function to extract sort value from item
 * @param {string} sortDirection - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export function sortItems(items, getSortValue, sortDirection = 'asc') {
  if (!Array.isArray(items)) return [];

  const itemsList = items.slice();

  itemsList.sort((itemA, itemB) => {
    const valueA = getSortValue(itemA);
    const valueB = getSortValue(itemB);

    // Handle numeric values
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    // Handle string values
    const stringA = String(valueA || '');
    const stringB = String(valueB || '');
    const comparison = stringA.localeCompare(stringB);

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return itemsList;
}

/**
 * Sorts items by newest first (using createdAt timestamp)
 * @param {Array} items - Array of items with createdAt field
 * @returns {Array} Sorted array
 */
export function sortByNewest(items) {
  if (!Array.isArray(items)) return [];

  const itemsList = items.slice();

  return itemsList.sort((itemA, itemB) => {
    const dateA = itemA?.createdAt ? new Date(itemA.createdAt).getTime() : 0;
    const dateB = itemB?.createdAt ? new Date(itemB.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Converts a date to timestamp for sorting
 * @param {string|Date|null} date - Date to convert
 * @returns {number} Timestamp or 0 if invalid
 */
export function dateToTimestamp(date) {
  if (!date) return 0;
  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Gets default sort direction based on column type
 * @param {string} columnKey - Column identifier
 * @param {Array} textColumns - Array of column keys that should sort ascending by default
 * @returns {string} 'asc' or 'desc'
 */
export function getDefaultSortDirection(columnKey, textColumns = ['nome', 'name', 'event', 'client', 'cliente']) {
  return textColumns.includes(columnKey) ? 'asc' : 'desc';
}

/**
 * Pads a string with zeros for numeric sorting
 * @param {string|number} value - Value to pad
 * @param {number} length - Target length
 * @returns {string} Padded string
 */
export function padForSorting(value, length = 4) {
  return String(value ?? '').padStart(length, '0');
}

/**
 * Filtering utilities for search and filter operations
 */

/**
 * Performs case-insensitive search across multiple fields
 * @param {Object} item - Item to search
 * @param {string} query - Search query
 * @param {Array} fields - Array of field names to search in
 * @returns {boolean} True if item matches query
 */
export function searchInFields(item, query, fields) {
  if (!query || !query.trim()) return true;

  const queryLower = query.toLowerCase().trim();

  return fields.some(field => {
    const value = getNestedValue(item, field);
    return String(value || '').toLowerCase().includes(queryLower);
  });
}

/**
 * Gets nested object value by path (e.g., 'user.name')
 * @param {Object} obj - Object to query
 * @param {string} path - Dot-separated path
 * @returns {*} Value at path or undefined
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Filters items by status
 * @param {Array} items - Items to filter
 * @param {string} statusFilter - Status to filter by or 'ALL'
 * @param {string} statusField - Name of status field (default: 'status')
 * @returns {Array} Filtered items
 */
export function filterByStatus(items, statusFilter, statusField = 'status') {
  if (!statusFilter || statusFilter === 'ALL') return items;

  return items.filter(item => {
    const itemStatus = String(getNestedValue(item, statusField) || '').toUpperCase();
    return itemStatus === statusFilter.toUpperCase();
  });
}

/**
 * Filters items by date range
 * @param {Array} items - Items to filter
 * @param {string} dateField - Name of date field
 * @param {string} fromDate - Start date (ISO format)
 * @param {string} toDate - End date (ISO format)
 * @returns {Array} Filtered items
 */
export function filterByDateRange(items, dateField, fromDate, toDate) {
  if (!fromDate && !toDate) return items;

  return items.filter(item => {
    const itemDate = getNestedValue(item, dateField);
    if (!itemDate) return false;

    const date = new Date(itemDate);
    if (isNaN(date.getTime())) return false;

    if (fromDate) {
      const from = new Date(fromDate);
      if (date < from) return false;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include entire end date
      if (date > to) return false;
    }

    return true;
  });
}

/**
 * Applies multiple filters to items
 * @param {Array} items - Items to filter
 * @param {Object} filters - Object with filter configurations
 * @returns {Array} Filtered items
 */
export function applyFilters(items, filters = {}) {
  let result = items;

  // Search filter
  if (filters.query && filters.searchFields) {
    result = result.filter(item =>
      searchInFields(item, filters.query, filters.searchFields)
    );
  }

  // Status filter
  if (filters.status) {
    result = filterByStatus(result, filters.status, filters.statusField);
  }

  // Date range filter
  if (filters.dateField && (filters.fromDate || filters.toDate)) {
    result = filterByDateRange(result, filters.dateField, filters.fromDate, filters.toDate);
  }

  // Custom filter function
  if (typeof filters.customFilter === 'function') {
    result = result.filter(filters.customFilter);
  }

  return result;
}

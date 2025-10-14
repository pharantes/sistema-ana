/**
 * Pagination utilities for tables
 */

/**
 * Paginates an array of items
 * @param {Array} items - Array of items to paginate
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @returns {Array} Paginated items
 */
export function paginateItems(items, page, pageSize) {
  if (!Array.isArray(items)) return [];

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return items.slice(startIndex, endIndex);
}

/**
 * Calculates total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Number of items per page
 * @returns {number} Total pages
 */
export function calculateTotalPages(totalItems, pageSize) {
  return Math.max(1, Math.ceil((totalItems || 0) / Math.max(1, pageSize || 10)));
}

/**
 * Ensures page number is within valid range
 * @param {number} page - Current page
 * @param {number} totalPages - Total number of pages
 * @returns {number} Valid page number
 */
export function normalizePageNumber(page, totalPages) {
  return Math.max(1, Math.min(page, totalPages));
}

/**
 * Creates pagination info object
 * @param {Array} items - All items
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination info with items, page, totalPages, etc.
 */
export function createPaginationInfo(items, page, pageSize) {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = calculateTotalPages(totalItems, pageSize);
  const validPage = normalizePageNumber(page, totalPages);
  const paginatedItems = paginateItems(items, validPage, pageSize);

  return {
    items: paginatedItems,
    page: validPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
    startIndex: (validPage - 1) * pageSize,
    endIndex: Math.min(validPage * pageSize, totalItems)
  };
}

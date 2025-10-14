/**
 * Custom hook for table state management (sorting, filtering, pagination)
 */
import { useState, useMemo } from 'react';
import { sortItems, getDefaultSortDirection } from './sorting';
import { applyFilters } from './filtering';
import { createPaginationInfo } from './pagination';

/**
 * Hook for managing table state with sorting, filtering, and pagination
 * @param {Array} initialItems - Initial items array
 * @param {Object} config - Configuration object
 * @param {Function} config.getSortValue - Function to get sort value from item
 * @param {Array} config.searchFields - Fields to search in
 * @param {string} config.defaultSortKey - Initial sort key
 * @param {string} config.defaultSortDir - Initial sort direction
 * @param {number} config.defaultPageSize - Initial page size
 * @returns {Object} Table state and handlers
 */
export function useTableState(initialItems = [], config = {}) {
  const {
    getSortValue,
    searchFields = [],
    defaultSortKey = 'createdAt',
    defaultSortDir = 'desc',
    defaultPageSize = 10,
    textColumns = []
  } = config;

  // State
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Apply filters
  const filteredItems = useMemo(() => {
    return applyFilters(items, {
      query: searchQuery,
      searchFields,
      status: statusFilter,
      fromDate,
      toDate
    });
  }, [items, searchQuery, searchFields, statusFilter, fromDate, toDate]);

  // Apply sorting
  const sortedItems = useMemo(() => {
    if (!getSortValue) return filteredItems;

    return sortItems(
      filteredItems,
      (item) => getSortValue(item, sortKey),
      sortDir
    );
  }, [filteredItems, sortKey, sortDir, getSortValue]);

  // Apply pagination
  const paginationInfo = useMemo(() => {
    return createPaginationInfo(sortedItems, page, pageSize);
  }, [sortedItems, page, pageSize]);

  // Handlers
  const handleToggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(getDefaultSortDirection(key, textColumns));
    }
    setPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleDateRangeFilter = (from, to) => {
    setFromDate(from);
    setToDate(to);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const refreshItems = (newItems) => {
    setItems(newItems);
    setPage(1);
  };

  return {
    // Data
    items: paginationInfo.items,
    allItems: items,
    filteredCount: sortedItems.length,
    totalCount: items.length,

    // Pagination
    page: paginationInfo.page,
    pageSize,
    totalPages: paginationInfo.totalPages,
    hasNextPage: paginationInfo.hasNextPage,
    hasPrevPage: paginationInfo.hasPrevPage,

    // Sorting
    sortKey,
    sortDir,

    // Filters
    searchQuery,
    statusFilter,
    fromDate,
    toDate,

    // Handlers
    onToggleSort: handleToggleSort,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSearch: handleSearch,
    onStatusFilter: handleStatusFilter,
    onDateRangeFilter: handleDateRangeFilter,
    onClearFilters: handleClearFilters,
    refreshItems,
    setItems
  };
}

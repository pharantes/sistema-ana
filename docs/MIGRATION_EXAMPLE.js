/**
 * Example: Migrating a table component to use new utilities
 * 
 * This file demonstrates how to refactor an existing table component
 * to use the new shared utilities and hooks.
 */

// ============================================================================
// BEFORE: Traditional approach (200+ lines)
// ============================================================================

/*
"use client";
import { useState, useMemo } from 'react';
import { CompactTable, ThClickable, Td } from '../components/ui/Table';
import HeaderControls from '../components/ui/HeaderControls';

export default function OldTableComponent({ initialData }) {
  // Manual state management (~30 lines)
  const [items, setItems] = useState(initialData);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Manual filtering (~20 lines)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search logic
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.nome?.toLowerCase().includes(query) &&
            !item.email?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) return false;
      }
      
      return true;
    });
  }, [items, searchQuery, statusFilter]);
  
  // Manual sorting (~30 lines)
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    
    sorted.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortKey) {
        case 'nome':
          valueA = String(a.nome || '').toLowerCase();
          valueB = String(b.nome || '').toLowerCase();
          break;
        case 'date':
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
          break;
        default:
          return 0;
      }
      
      if (typeof valueA === 'number') {
        return sortDir === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      const comparison = valueA.localeCompare(valueB);
      return sortDir === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredItems, sortKey, sortDir]);
  
  // Manual pagination (~10 lines)
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);
  
  const totalPages = Math.ceil(sortedItems.length / pageSize);
  
  // Handlers (~20 lines)
  const handleToggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };
  
  // ... more code for rendering table (~100 lines)
  return (
    <>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />
      
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={sortedItems.length}
        onChangePage={setPage}
        onChangePageSize={setPageSize}
      />
      
      <CompactTable>
        <thead>
          <tr>
            <ThClickable onClick={() => handleToggleSort('nome')}>
              Nome {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            // ... more columns
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map(item => (
            <tr key={item._id}>
              <Td>{item.nome}</Td>
              // ... more cells
            </tr>
          ))}
        </tbody>
      </CompactTable>
    </>
  );
}
*/

// ============================================================================
// AFTER: Using new utilities (50 lines)
// ============================================================================

"use client";
import { DataTable, SearchFilterBar } from '@/app/components';
import { useTableState } from '@/app/utils';

export default function NewTableComponent({ initialData }) {
  // All state management in one hook (1 line vs 30+ lines!)
  const table = useTableState(initialData, {
    getSortValue: (item, key) => {
      switch (key) {
        case 'nome':
          return String(item.nome || '').toLowerCase();
        case 'date':
          return new Date(item.date).getTime();
        case 'email':
          return String(item.email || '').toLowerCase();
        default:
          return item[key];
      }
    },
    searchFields: ['nome', 'email', 'telefone'],
    defaultSortKey: 'date',
    defaultSortDir: 'desc',
    textColumns: ['nome', 'email']
  });

  // Define columns (much cleaner than manual table rendering)
  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <>
      <SearchFilterBar
        searchValue={table.searchQuery}
        onSearchChange={table.onSearch}
        statusFilter={table.statusFilter}
        onStatusChange={table.onStatusFilter}
        onClear={table.onClearFilters}
        onCreate={() => console.log('Create new item')}
        createLabel="Novo Item"
      />

      <DataTable
        columns={columns}
        rows={table.items}
        page={table.page}
        pageSize={table.pageSize}
        total={table.filteredCount}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onToggleSort={table.onToggleSort}
        onChangePage={table.onPageChange}
        onChangePageSize={table.onPageSizeChange}
        renderActions={(row) => (
          <>
            <button onClick={() => console.log('Edit', row)}>Editar</button>
            <button onClick={() => console.log('Delete', row)}>Excluir</button>
          </>
        )}
      />
    </>
  );
}

// ============================================================================
// Benefits:
// ============================================================================
// - 75% less code (200 lines → 50 lines)
// - Consistent behavior across all tables
// - Easier to maintain (logic in reusable utilities)
// - Easier to test (pure functions)
// - Easier to extend (add features in one place)
// - Better readability (declarative column config)
// - No duplicate code

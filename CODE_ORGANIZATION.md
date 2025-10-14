# Code Organization and Best Practices

This document describes the refactored codebase structure and provides guidelines for maintaining clean, reusable code.

## 📁 Directory Structure

### `/app/components/`
Reusable UI components used across the application.

#### Core Components
- `KPICard.js` - Dashboard metric cards
- `ChartContainer.js` - Chart wrapper with title and empty states
- `StatusBadge.js` - Status indicator badges with color coding
- `SearchFilterBar.js` - Search and filter controls
- `DataTable.js` - Generic table component with sorting/pagination

#### Form Components
- `FormElements.js` - Styled form inputs and buttons
- `BRDateInput.js` - Brazilian date format input
- `BRCurrencyInput.js` - Brazilian currency input (R$)
- `Modal.js` - Base modal component
- `DeleteModal.js` - Confirmation modal for deletions

#### Exports
- `index.js` - Central export for all components (use this for imports)

### `/app/utils/`
Shared utility functions and custom hooks.

#### Utilities
- `sorting.js` - Generic sorting functions for tables
- `filtering.js` - Search and filter utilities
- `pagination.js` - Pagination helpers
- `constants.js` - Shared constants (status options, API endpoints, etc.)
- `index.js` - Central export for all utilities

#### Custom Hooks
- `useTableState.js` - Table state management (sorting, filtering, pagination)
- `useApi.js` - API call hooks with loading/error states
  - `useApiCall()` - Execute async API calls
  - `useFetch()` - Fetch data with automatic loading
  - `useFormSubmit()` - Form submission with loading/error/success

### `/app/components/ui/`
Low-level UI primitives and styled components.

- `Table.js` - Table elements (Table, Th, Td, ThClickable)
- `Pager.js` - Pagination component
- `HeaderControls.js` - Table header with pagination controls
- `FilterRow.js` - Filter layout component
- `primitives.js` - Basic styled elements (buttons, rows, labels)

## 🎯 Usage Examples

### Using DataTable Component

```javascript
import { DataTable } from '@/app/components';

const columns = [
  { key: 'codigo', label: 'Código', sortable: true, width: '80px' },
  { key: 'nome', label: 'Nome', sortable: true },
  { 
    key: 'value', 
    label: 'Valor',
    sortable: true,
    render: (row) => formatBRL(row.value)
  }
];

<DataTable
  columns={columns}
  rows={data}
  page={page}
  pageSize={pageSize}
  total={total}
  sortKey={sortKey}
  sortDir={sortDir}
  onToggleSort={handleSort}
  onChangePage={setPage}
  onChangePageSize={setPageSize}
  renderActions={(row) => (
    <>
      <button onClick={() => edit(row)}>Editar</button>
      <button onClick={() => delete(row)}>Excluir</button>
    </>
  )}
/>
```

### Using useTableState Hook

```javascript
import { useTableState } from '@/app/utils';

function MyTable({ initialData }) {
  const table = useTableState(initialData, {
    getSortValue: (item, key) => {
      switch (key) {
        case 'nome': return item.nome.toLowerCase();
        case 'date': return new Date(item.date).getTime();
        default: return item[key];
      }
    },
    searchFields: ['nome', 'email', 'telefone'],
    defaultSortKey: 'date',
    defaultSortDir: 'desc'
  });

  return (
    <>
      <SearchFilterBar
        searchValue={table.searchQuery}
        onSearchChange={table.onSearch}
        statusFilter={table.statusFilter}
        onStatusChange={table.onStatusFilter}
        onClear={table.onClearFilters}
      />
      
      <DataTable
        rows={table.items}
        page={table.page}
        pageSize={table.pageSize}
        total={table.totalPages}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onToggleSort={table.onToggleSort}
        onChangePage={table.onPageChange}
        onChangePageSize={table.onPageSizeChange}
      />
    </>
  );
}
```

### Using API Hooks

```javascript
import { useApiCall, useFetch, useFormSubmit } from '@/app/utils/useApi';

// Simple API call
function MyComponent() {
  const { loading, error, execute } = useApiCall();
  
  const handleDelete = async (id) => {
    const result = await execute(deleteItem, id);
    if (result.success) {
      console.log('Deleted!');
    }
  };
}

// Data fetching
function DataComponent() {
  const { data, loading, error, refetch } = useFetch(fetchData);
  
  useEffect(() => {
    refetch();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{data}</div>;
}

// Form submission
function FormComponent() {
  const { handleSubmit, loading, error, success } = useFormSubmit(
    submitForm,
    {
      onSuccess: (data) => console.log('Success!', data),
      onError: (err) => console.error('Error!', err)
    }
  );
  
  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(formData);
  };
}
```

### Using Shared Constants

```javascript
import { 
  STATUS_OPTIONS, 
  PAYMENT_STATUS_OPTIONS,
  API_ENDPOINTS 
} from '@/app/utils/constants';

// Use in filters
<select value={status}>
  {PAYMENT_STATUS_OPTIONS.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>

// Use in API calls
fetch(API_ENDPOINTS.CLIENTES)
```

## 🎨 Component Patterns

### KPI Cards

```javascript
import { KPICard } from '@/app/components';

<KPICard
  label="Total de Clientes"
  value={clientCount}
  subtext="ativos no sistema"
  color="#2563eb"
/>
```

### Status Badges

```javascript
import { StatusBadge } from '@/app/components';

<StatusBadge status="PAGO" />
<StatusBadge status="ABERTO" />
<StatusBadge status="RECEBIDO" />
```

### Chart Containers

```javascript
import { ChartContainer } from '@/app/components';
import { ResponsiveLine } from '@nivo/line';

<ChartContainer 
  title="Receita Mensal" 
  height="400px"
  isEmpty={data.length === 0}
>
  <ResponsiveLine data={data} {...config} />
</ChartContainer>
```

## 📝 Best Practices

### 1. Import from Index Files
```javascript
// ✅ Good
import { DataTable, KPICard, StatusBadge } from '@/app/components';
import { sortItems, filterByStatus } from '@/app/utils';

// ❌ Avoid
import DataTable from '@/app/components/ui/DataTable';
import { sortItems } from '@/app/utils/sorting';
```

### 2. Use Custom Hooks for State Management
```javascript
// ✅ Good - Using useTableState
const table = useTableState(data, config);

// ❌ Avoid - Managing state manually
const [page, setPage] = useState(1);
const [sortKey, setSortKey] = useState('');
const [sortDir, setSortDir] = useState('asc');
// ... etc
```

### 3. Use Shared Constants
```javascript
// ✅ Good
import { STATUS_OPTIONS } from '@/app/utils/constants';
if (status === STATUS_OPTIONS.PAGO) { }

// ❌ Avoid
if (status === 'PAGO') { } // Magic strings
```

### 4. Extract Large Components
When a component exceeds ~300 lines:
- Extract subcomponents
- Move helper functions to utilities
- Use custom hooks for complex logic

### 5. Colocate Related Code
- Keep component-specific styles in the same file
- Keep helper functions near where they're used
- Move only truly shared code to `/utils`

## 🔄 Migration Guide

To migrate existing components to use new utilities:

1. **Replace manual sorting:**
   ```javascript
   // Before
   const sorted = items.sort((a, b) => { ... });
   
   // After
   import { sortItems } from '@/app/utils';
   const sorted = sortItems(items, getSortValue, sortDir);
   ```

2. **Replace manual pagination:**
   ```javascript
   // Before
   const start = (page - 1) * pageSize;
   const paginated = items.slice(start, start + pageSize);
   
   // After
   import { paginateItems } from '@/app/utils';
   const paginated = paginateItems(items, page, pageSize);
   ```

3. **Use useTableState:**
   ```javascript
   // Replaces ~50 lines of state management code
   const table = useTableState(data, config);
   ```

## 🚀 Future Improvements

- [ ] Add unit tests for utility functions
- [ ] Create Storybook for component documentation
- [ ] Add TypeScript definitions
- [ ] Create more specialized hooks (useDebounce, useLocalStorage, etc.)
- [ ] Add error boundary components
- [ ] Create loading skeleton components

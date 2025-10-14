/**
 * Reusable search and filter bar component
 */
"use client";
import styled from 'styled-components';
import { SearchBar } from './ui';
import * as FE from './FormElements';
import { RowGap6 } from './ui/primitives';

const FilterBar = styled(RowGap6)`
  margin-bottom: var(--space-sm, 12px);
  align-items: flex-end;
`;

const SearchField = styled.div`
  flex: 1;
  min-width: 260px;
  max-width: 400px;
`;

const FilterField = styled.div`
  min-width: 150px;
`;

const ActionsGroup = styled(FE.ActionsInline)`
  margin-left: auto;
  gap: var(--gap-xs, 6px);
`;

/**
 * Search and filter bar with common controls
 * @param {Object} props - Component props
 * @param {string} props.searchValue - Current search query
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {string} props.statusFilter - Current status filter
 * @param {Function} props.onStatusChange - Status filter change handler
 * @param {Array} props.statusOptions - Array of status options [{value, label}]
 * @param {Function} props.onClear - Clear filters handler
 * @param {Function} props.onExport - Optional export handler
 * @param {Function} props.onCreate - Optional create handler
 * @param {string} props.createLabel - Label for create button
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.children - Additional filter controls
 */
export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  statusFilter,
  onStatusChange,
  statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ABERTO', label: 'Aberto' },
    { value: 'PAGO', label: 'Pago' }
  ],
  onClear,
  onExport,
  onCreate,
  createLabel = "Novo",
  loading = false,
  children
}) {
  return (
    <FilterBar>
      <SearchField>
        <SearchBar
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </SearchField>

      {onStatusChange && (
        <FilterField>
          <FE.Select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={loading}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FE.Select>
        </FilterField>
      )}

      {children}

      <ActionsGroup>
        {onClear && (
          <FE.SecondaryButton onClick={onClear} disabled={loading}>
            Limpar
          </FE.SecondaryButton>
        )}

        {onExport && (
          <FE.SecondaryButton onClick={onExport} disabled={loading}>
            Exportar PDF
          </FE.SecondaryButton>
        )}

        {onCreate && (
          <FE.Button onClick={onCreate} disabled={loading}>
            {createLabel}
          </FE.Button>
        )}
      </ActionsGroup>
    </FilterBar>
  );
}

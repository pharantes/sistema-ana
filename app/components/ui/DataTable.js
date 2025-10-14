/**
 * Generic reusable DataTable component with sorting, pagination, and actions
 */
"use client";
import styled from 'styled-components';
import { CompactTable, ThClickable as BaseThClickable, Th as BaseTh, Td as BaseTd } from "./Table";
import HeaderControls from "./HeaderControls";
import * as FE from "../FormElements";

// Styled components with dynamic width and alignment
const ThClickable = styled(BaseThClickable)`
  width: ${props => props.$width || 'auto'};
  text-align: ${props => props.$align || 'left'} !important;
`;

const Th = styled(BaseTh)`
  width: ${props => props.$width || 'auto'};
  text-align: ${props => props.$align || 'left'} !important;
`;

const Td = styled(BaseTd)`
  text-align: ${props => props.$align || 'left'} !important;
`;

const ClickableRow = styled.tr`
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
`;

/**
 * Column configuration object type:
 * {
 *   key: string,           // Unique column identifier
 *   label: string,         // Column header label
 *   sortable?: boolean,    // Whether column is sortable
 *   render?: (row) => JSX, // Custom render function
 *   width?: string,        // CSS width value
 *   align?: string         // Text alignment
 * }
 */

/**
 * Generic data table component with built-in sorting and pagination
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column configurations
 * @param {Array} props.rows - Array of data rows
 * @param {number} props.page - Current page
 * @param {number} props.pageSize - Items per page
 * @param {number} props.total - Total items count
 * @param {Function} props.onChangePage - Page change handler
 * @param {Function} props.onChangePageSize - Page size change handler
 * @param {string} props.sortKey - Current sort key
 * @param {string} props.sortDir - Current sort direction
 * @param {Function} props.onToggleSort - Sort toggle handler
 * @param {Function} props.renderActions - Function to render action buttons per row
 * @param {string} props.rowKey - Field name to use as row key (default: '_id')
 * @param {Function} props.onRowClick - Optional row click handler
 * @param {boolean} props.compact - Whether to show compact view
 */
export default function DataTable({
  columns = [],
  rows = [],
  page,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
  sortKey,
  sortDir,
  onToggleSort,
  renderActions,
  rowKey = '_id',
  onRowClick,
  compact = false
}) {
  return (
    <>
      {!compact && (
        <HeaderControls
          page={page}
          pageSize={pageSize}
          total={total}
          onChangePage={onChangePage}
          onChangePageSize={onChangePageSize}
        />
      )}

      <CompactTable>
        <thead>
          <tr>
            {columns.map(column => {
              const isSortable = column.sortable !== false;
              const isActive = sortKey === column.key;
              const sortIndicator = isActive
                ? (sortDir === 'asc' ? ' ▲' : ' ▼')
                : '';

              return isSortable ? (
                <ThClickable
                  key={column.key}
                  onClick={() => onToggleSort?.(column.key)}
                  $width={column.width}
                  $align={column.align}
                >
                  {column.label}{sortIndicator}
                </ThClickable>
              ) : (
                <Th
                  key={column.key}
                  $width={column.width}
                  $align={column.align}
                >
                  {column.label}
                </Th>
              );
            })}
            {renderActions && <Th>Opções</Th>}
          </tr>
        </thead>

        <tbody>
          {rows.map(row => {
            const key = row[rowKey] || JSON.stringify(row);

            return (
              <ClickableRow
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                $clickable={!!onRowClick}
              >
                {columns.map(column => {
                  const value = column.render
                    ? column.render(row)
                    : getNestedValue(row, column.key);

                  return (
                    <Td
                      key={column.key}
                      $align={column.align}
                    >
                      {value}
                    </Td>
                  );
                })}

                {renderActions && (
                  <Td>
                    <FE.ActionsRow>
                      {renderActions(row)}
                    </FE.ActionsRow>
                  </Td>
                )}
              </ClickableRow>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <Td colSpan={columns.length + (renderActions ? 1 : 0)} $align="center" style={{ padding: '2rem' }}>
                Nenhum registro encontrado
              </Td>
            </tr>
          )}
        </tbody>
      </CompactTable>
    </>
  );
}

/**
 * Helper to get nested value from object by path
 */
function getNestedValue(obj, path) {
  if (!path) return obj;

  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

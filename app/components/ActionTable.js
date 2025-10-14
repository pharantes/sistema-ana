"use client";
import styled from "styled-components";
import { ActionsRow, SmallSecondaryButton, SmallInlineButton } from './FormElements';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { actionListColumns } from "../utils/columns";
import { formatDateBR } from "@/lib/utils/dates";
import { Table, ThClickable, Th, Td } from "./ui/Table";
import { RowEnd, RowTopGap } from './ui/primitives';
import LinkButton from './ui/LinkButton';
import Pager from "./ui/Pager";
import PageSizeSelector from "./ui/PageSizeSelector";

// Use shared Table, Th, Td (with zebra striping)
// TopRow/BottomRow reuse the shared RowInline primitive for compact inline controls

const TopRow = styled(RowEnd)`
  margin: var(--space-xs) 0 var(--space-xxs);
`;

const BottomRow = RowTopGap;

// Pagination now handled by shared Pager component

/**
 * Gets the sortable value from an action for a given key
 * @param {Object} action - The action object
 * @param {string} sortKey - The key to sort by (date, event, start, end, client)
 * @returns {number|string|null} The sortable value
 */
function getSortValue(action, sortKey) {
  if (!action) return null;

  switch (sortKey) {
    case 'date':
      return action.date
        ? new Date(action.date).getTime()
        : (action.createdAt ? new Date(action.createdAt).getTime() : 0);
    case 'event':
      return String(action.name || action.event || '').toLowerCase();
    case 'start':
      return action.startDate ? new Date(action.startDate).getTime() : 0;
    case 'end':
      return action.endDate ? new Date(action.endDate).getTime() : 0;
    case 'client':
      return String(action.clientName || action.client || '').toLowerCase();
    default:
      return 0;
  }
}

/**
 * Compares two values for sorting
 * @param {any} valueA - First value
 * @param {any} valueB - Second value
 * @param {string} sortDirection - Sort direction ('asc' or 'desc')
 * @returns {number} Comparison result
 */
function compareValues(valueA, valueB, sortDirection) {
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  }

  const stringA = String(valueA || '');
  const stringB = String(valueB || '');
  const comparison = stringA.localeCompare(stringB);
  return sortDirection === 'asc' ? comparison : -comparison;
}

/**
 * Checks if the user can edit the action
 * @param {Object} action - The action object
 * @param {Object} session - The session object
 * @returns {boolean} Whether user can edit
 */
function canEditAction(action, session) {
  if (session.user.role === 'admin') return true;
  if (!Array.isArray(action.staff)) return false;
  return action.staff.map(staffMember => staffMember.name).includes(session.user.username);
}

/**
 * Renders a table of actions with sorting and pagination
 * @param {Object} props - Component props
 * @param {Array} props.actions - List of actions to display
 * @param {Object} props.session - User session
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onDelete - Delete callback
 */
export default function ActionTable({ actions, session, onEdit, onDelete }) {
  const router = useRouter();
  const gotoAction = (actionId) => router.push(`/acoes/${actionId}`);
  const gotoCliente = (clientId) => router.push(`/clientes/${clientId}`);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('date'); // 'date' | 'event' | 'start' | 'end' | 'client'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const totalActions = actions?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalActions / pageSize));

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const sortedActions = useMemo(() => {
    const actionList = Array.isArray(actions) ? actions.slice() : [];

    actionList.sort((actionA, actionB) => {
      const valueA = getSortValue(actionA, sortKey);
      const valueB = getSortValue(actionB, sortKey);
      return compareValues(valueA, valueB, sortDirection);
    });

    return actionList;
  }, [actions, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedActions.slice(startIndex, startIndex + pageSize);
  }, [sortedActions, currentPage, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'event' || key === 'client' ? 'asc' : 'desc');
    }
  };

  const handlePageSizeChange = (newSize) => {
    setCurrentPage(1);
    setPageSize(newSize);
  };

  return (
    <>
      <TopRow>
        <Pager
          page={currentPage}
          pageSize={pageSize}
          total={totalActions}
          onChangePage={setCurrentPage}
          compact
          inline
        />
        <PageSizeSelector
          pageSize={pageSize}
          total={totalActions}
          onChange={handlePageSizeChange}
        />
      </TopRow>
      <Table>
        <thead>
          <tr>
            {actionListColumns.map(column => (
              <ThClickable key={column.key} onClick={() => toggleSort(column.key)}>
                {column.label}{' '}
                {sortKey === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
            ))}
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((action) => (
            <tr key={action._id}>
              <Td>{formatDateBR(action.date)}</Td>
              <Td>
                <LinkButton onClick={() => gotoAction(action._id)}>
                  {action.name || action.event}
                </LinkButton>
              </Td>
              <Td>{formatDateBR(action.startDate)}</Td>
              <Td>{formatDateBR(action.endDate)}</Td>
              <Td>
                <LinkButton onClick={() => gotoCliente(action.client)}>
                  {action.clientName || action.client}
                </LinkButton>
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                {canEditAction(action, session) && (
                  <ActionsRow>
                    <SmallSecondaryButton onClick={() => onEdit(action)}>
                      Editar
                    </SmallSecondaryButton>
                    {session.user.role === "admin" && (
                      <SmallInlineButton onClick={() => onDelete(action)}>
                        Excluir
                      </SmallInlineButton>
                    )}
                  </ActionsRow>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {totalActions > pageSize && (
        <BottomRow>
          <Pager
            page={currentPage}
            pageSize={pageSize}
            total={totalActions}
            onChangePage={setCurrentPage}
            compact
          />
        </BottomRow>
      )}
    </>
  );
}

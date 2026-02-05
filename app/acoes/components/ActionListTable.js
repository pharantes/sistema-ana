"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, ThClickable, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import { ActionsRow, SmallSecondaryButton, SmallInlineButton } from '../../components/FormElements';
import LinkButton from '../../components/ui/LinkButton';
import { formatDateBR } from "@/lib/utils/dates";

const COLUMNS = [
  { key: 'date', label: 'Data' },
  { key: 'event', label: 'Ação' },
  { key: 'start', label: 'Início' },
  { key: 'end', label: 'Fim' },
  { key: 'client', label: 'Cliente' },
];

/**
 * Gets sort value for an action based on column key
 */
function getSortValue(action, columnKey) {
  if (!action) return null;

  switch (columnKey) {
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
 * Sorts actions array by the specified key and direction
 */
function sortActions(actions, sortKey, sortDirection) {
  const actionsList = Array.isArray(actions) ? actions.slice() : [];

  actionsList.sort((actionA, actionB) => {
    const valueA = getSortValue(actionA, sortKey);
    const valueB = getSortValue(actionB, sortKey);

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const stringA = String(valueA || '');
    const stringB = String(valueB || '');
    const comparison = stringA.localeCompare(stringB);

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return actionsList;
}

/**
 * Gets the default sort direction for a column
 */
function getDefaultSortDirection(columnKey) {
  return (columnKey === 'event' || columnKey === 'client') ? 'asc' : 'desc';
}

/**
 * Checks if user can edit the action
 */
function canUserEditAction(action, userSession) {
  const userRole = userSession.user.role;
  if (userRole === "admin" || userRole === "staff") {
    return true;
  }

  if (Array.isArray(action.staff)) {
    const staffNames = action.staff.map(staffMember => staffMember.name);
    return staffNames.includes(userSession.user.username);
  }

  return false;
}

/**
 * ActionListTable - Displays a sortable, paginated table of actions
 */
export default function ActionListTable({ actions = [], session, onEdit, onDelete }) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const totalActions = actions?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalActions / pageSize));

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const sortedActions = useMemo(() => {
    return sortActions(actions, sortKey, sortDirection);
  }, [actions, sortKey, sortDirection]);

  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedActions.slice(startIndex, startIndex + pageSize);
  }, [sortedActions, currentPage, pageSize]);

  const handleToggleSort = (columnKey) => {
    if (sortKey === columnKey) {
      setSortDirection(currentDirection =>
        currentDirection === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortKey(columnKey);
      setSortDirection(getDefaultSortDirection(columnKey));
    }
  };

  return (
    <>
      <HeaderControls
        page={currentPage}
        pageSize={pageSize}
        total={totalActions}
        onChangePage={setCurrentPage}
        onChangePageSize={setPageSize}
      />
      <Table>
        <thead>
          <tr>
            {COLUMNS.map(column => (
              <ThClickable key={column.key} onClick={() => handleToggleSort(column.key)}>
                {column.label} {sortKey === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
            ))}
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {paginatedActions.map((action) => {
            const hasEditPermission = canUserEditAction(action, session);

            return (
              <tr key={action._id}>
                <Td>{formatDateBR(action.date)}</Td>
                <Td>
                  <LinkButton onClick={() => router.push(`/acoes/${action._id}`)}>
                    {action.name || action.event}
                  </LinkButton>
                </Td>
                <Td>{formatDateBR(action.startDate)}</Td>
                <Td>{formatDateBR(action.endDate)}</Td>
                <Td>
                  <LinkButton onClick={() => router.push(`/clientes/${action.client}`)}>
                    {action.clientName || action.client}
                  </LinkButton>
                </Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  {hasEditPermission ? (
                    <ActionsRow>
                      <SmallSecondaryButton onClick={() => onEdit(action)}>
                        Editar
                      </SmallSecondaryButton>
                      {(session.user.role === "admin" || session.user.role === "staff") && (
                        <SmallInlineButton onClick={() => onDelete(action)}>
                          Excluir
                        </SmallInlineButton>
                      )}
                    </ActionsRow>
                  ) : null}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <HeaderControls
        page={currentPage}
        pageSize={pageSize}
        total={totalActions}
        onChangePage={setCurrentPage}
        onChangePageSize={setPageSize}
      />
    </>
  );
}

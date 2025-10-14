"use client";
import { ThClickable, Th, Td, CompactTable } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import * as FE from "../../components/FormElements";
import LinkButton from "../../components/ui/LinkButton";

/**
 * Table component for displaying clients (clientes).
 * Shows sortable, paginated list with CRUD operations.
 * @param {object} props - Component props
 * @param {Array} props.rows - Array of client objects
 * @param {number} props.page - Current page number
 * @param {number} props.pageSize - Number of items per page
 * @param {number} props.total - Total number of items
 * @param {Function} props.onChangePage - Handler for changing page
 * @param {Function} props.onChangePageSize - Handler for changing page size
 * @param {string} props.sortKey - Current sort key
 * @param {string} props.sortDir - Current sort direction ('asc' or 'desc')
 * @param {Function} props.onToggleSort - Handler for toggling sort
 * @param {Function} props.onEdit - Handler for editing a client
 * @param {Function} props.onDelete - Handler for deleting a client
 * @param {Function} props.onOpenDetails - Handler for opening client details
 * @param {boolean} props.canDelete - Whether delete button should be shown
 */
export default function ClientesTable({
  rows = [],
  page,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
  sortKey,
  sortDir,
  onToggleSort,
  onEdit,
  onDelete,
  onOpenDetails,
  canDelete = true,
}) {
  return (
    <>
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={onChangePage}
        onChangePageSize={onChangePageSize}
      />
      <CompactTable>
        <thead>
          <tr>
            <ThClickable onClick={() => onToggleSort('codigo')}>
              Código {sortKey === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('nome')}>
              Cliente {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Endereço</Th>
            <ThClickable onClick={() => onToggleSort('cidade')}>
              Cidade {sortKey === 'cidade' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('uf')}>
              UF {sortKey === 'uf' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Telefone</Th>
            <Th>Email</Th>
            <Th>Contato</Th>
            <ThClickable onClick={() => onToggleSort('tipo')}>
              Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>CNPJ/CPF</Th>
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((cliente) => (
            <tr key={cliente._id}>
              <Td>{cliente.codigo}</Td>
              <Td>
                <LinkButton onClick={() => onOpenDetails?.(cliente)}>
                  {cliente.nome}
                </LinkButton>
              </Td>
              <Td>{cliente.endereco}</Td>
              <Td>{cliente.cidade}</Td>
              <Td>{cliente.uf}</Td>
              <Td>{cliente.telefone}</Td>
              <Td>{cliente.email}</Td>
              <Td>{cliente.nomeContato}</Td>
              <Td>{cliente.tipo}</Td>
              <Td>{cliente.cnpjCpf}</Td>
              <Td>
                <FE.ActionsRow>
                  <FE.SmallSecondaryButton onClick={() => onEdit?.(cliente)}>
                    Editar
                  </FE.SmallSecondaryButton>
                  {canDelete && (
                    <FE.SmallInlineButton onClick={() => onDelete?.(cliente)}>
                      Excluir
                    </FE.SmallInlineButton>
                  )}
                </FE.ActionsRow>
              </Td>
            </tr>
          ))}
        </tbody>
      </CompactTable>
    </>
  );
}

/**
 * Wrapper component that includes footer controls below the table.
 * Useful for tables with many rows to provide navigation at both top and bottom.
 * @param {object} props - All props from ClientesTable component
 */
export function ClientesTableWithFooter(props) {
  return (
    <>
      <ClientesTable {...props} />
      <HeaderControls
        page={props.page}
        pageSize={props.pageSize}
        total={props.total}
        onChangePage={props.onChangePage}
        onChangePageSize={props.onChangePageSize}
      />
    </>
  );
}

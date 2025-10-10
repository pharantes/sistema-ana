"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import * as FE from "../../components/FormElements";

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
      <HeaderControls page={page} pageSize={pageSize} total={total} onChangePage={onChangePage} onChangePageSize={onChangePageSize} />
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('codigo')}>
              Código {sortKey === 'codigo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('nome')}>
              Cliente {sortKey === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Endereço</Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('cidade')}>
              Cidade {sortKey === 'cidade' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('uf')}>
              UF {sortKey === 'uf' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Telefone</Th>
            <Th>Email</Th>
            <Th>Contato</Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('tipo')}>
              Tipo {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>CNPJ/CPF</Th>
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((cliente) => (
            <tr key={cliente._id}>
              <Td>{cliente.codigo}</Td>
              <Td style={{ textAlign: 'left' }}>
                <button onClick={() => onOpenDetails?.(cliente)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>
                  {cliente.nome}
                </button>
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
                  <FE.SmallSecondaryButton onClick={() => onEdit?.(cliente)}>Editar</FE.SmallSecondaryButton>
                  {canDelete && (
                    <FE.SmallInlineButton onClick={() => onDelete?.(cliente)}>Excluir</FE.SmallInlineButton>
                  )}
                </FE.ActionsRow>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

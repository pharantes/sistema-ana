"use client";
import { Table, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import StatusSelect from "../../components/ui/StatusSelect";
import { formatDateBR } from "@/lib/utils/dates";
import { formatBRL } from "@/app/utils/currency";

export default function AcoesTable({
  rows = [],
  page,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
  sortKey,
  sortDir,
  onToggleSort,
  onChangeStatus,
}) {
  return (
    <>
      <HeaderControls
        page={page}
        pageSize={pageSize}
        total={total}
        onChangePage={onChangePage}
        onChangePageSize={(n) => { onChangePage(1); onChangePageSize(n); }}
      />
      <Table>
        <thead>
          <tr>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('date')}>
              Data {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('acao')}>
              Ação {sortKey === 'acao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('cliente')}>
              Cliente {sortKey === 'cliente' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Descrição</Th>
            <Th>Qtde Parcela</Th>
            <Th>Valor Parcela</Th>
            <Th>Valor total</Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('venc')}>
              Data Vencimento {sortKey === 'venc' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggleSort('receb')}>
              Data Recebimento {sortKey === 'receb' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </Th>
            <Th>Status</Th>
            <Th>Opções</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const r = row.receivable || {};
            const venc = formatDateBR(r?.dataVencimento);
            const receb = formatDateBR(r?.dataRecebimento);
            const data = formatDateBR(row?.date);
            return (
              <tr key={row._id} onClick={() => globalThis.location.assign(`/contasareceber/${row._id}`)} style={{ cursor: 'pointer' }}>
                <Td>{data}</Td>
                <Td style={{ textAlign: 'left' }}>
                  <span style={{ display: 'inline-block', textAlign: 'left' }}>{row.name}</span>
                </Td>
                <Td>{row.clientName || ''}</Td>
                <Td>{r?.descricao || ''}</Td>
                <Td>{r?.qtdeParcela ?? ''}</Td>
                <Td>{r?.valorParcela != null ? `R$ ${formatBRL(Number(r.valorParcela))}` : ''}</Td>
                <Td>{r?.valor != null ? `R$ ${formatBRL(Number(r.valor))}` : ''}</Td>
                <Td>{venc}</Td>
                <Td>{receb}</Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusSelect
                      value={(r?.status || 'ABERTO')}
                      options={[{ value: 'ABERTO', label: 'ABERTO' }, { value: 'RECEBIDO', label: 'RECEBIDO' }]}
                      onChange={(e) => onChangeStatus(row, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </Td>
                <Td>
                  <button
                    onClick={(e) => { e.stopPropagation(); onChangeStatus(row, null, { openModal: true }); }}
                    style={{ background: 'none', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}

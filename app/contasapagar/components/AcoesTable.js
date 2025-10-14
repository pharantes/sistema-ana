"use client";
import { CompactTable as Table, ThClickable, Th, Td } from "../../components/ui/Table";
import HeaderControls from "../../components/ui/HeaderControls";
import ColaboradorCell from "../../components/ui/ColaboradorCell";
import StatusSelect from "../../components/ui/StatusSelect";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatBRL } from "../../utils/currency";
import { formatDateBR } from "@/lib/utils/dates";
import LinkButton from '../../components/ui/LinkButton';

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
  session,
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
            <ThClickable onClick={() => onToggleSort('created')}>
              Data {sortKey === 'created' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('acao')}>
              Ação {sortKey === 'acao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <ThClickable onClick={() => onToggleSort('colaborador')}>
              Colaborador/Empresa {sortKey === 'colaborador' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Descrição</Th>
            <ThClickable onClick={() => onToggleSort('due')}>
              Vencimento {sortKey === 'due' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </ThClickable>
            <Th>Valor</Th>
            <Th>Pgt</Th>
            <Th>Banco/PIX</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(report => (
            <tr key={report._id}>
              <Td>{report.actionId?.date ? formatDateBR(report.actionId.date) : formatDateBR(report.reportDate)}</Td>
              <Td>
                {report?.actionId?._id ? (
                  <LinkButton onClick={() => globalThis.location.assign(`/acoes/${report.actionId._id}`)}>
                    {report.actionId?.name || ""}
                  </LinkButton>
                ) : (report.actionId?.name || "")}
              </Td>
              <Td><ColaboradorCell report={report} /></Td>
              <Td>{(() => {
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                return ct?.description || '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const d = st?.vencimento || ct?.vencimento;
                return formatDateBR(d);
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const val = (st && typeof st.value !== 'undefined') ? Number(st.value) : (ct && typeof ct.value !== 'undefined') ? Number(ct.value) : null;
                return (val != null) ? formatBRL(val) : '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                return st?.pgt || ct?.pgt || '';
              })()}</Td>
              <Td>{(() => {
                const staff = Array.isArray(report.actionId?.staff) ? report.actionId.staff : [];
                const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
                const st = report.staffName ? staff.find(s => s.name === report.staffName) : null;
                const ct = (!report.staffName && report.costId) ? costs.find(c => String(c._id) === String(report.costId)) : null;
                const method = (st?.pgt || ct?.pgt || '').toUpperCase();
                if (method === 'PIX') return st?.pix || ct?.pix || '';
                if (method === 'TED') return st?.bank || ct?.bank || '';
                return '';
              })()}</Td>
              <Td>
                {session.user.role === "admin" ? (
                  <StatusSelect
                    value={(report.status || "ABERTO").toUpperCase()}
                    options={[{ value: 'ABERTO', label: 'ABERTO' }, { value: 'PAGO', label: 'PAGO' }]}
                    onChange={(e) => onChangeStatus(report._id, e.target.value, report.status || "ABERTO")}
                  />
                ) : (
                  <StatusBadge value={(report.status || "ABERTO").toUpperCase()} />
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

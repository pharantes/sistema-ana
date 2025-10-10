"use client";
/* eslint-env browser */
// Removed global fetch directive as it is a built-in
/* eslint-disable no-unused-vars */
import { useEffect, useState, Fragment } from "react";
import styled from "styled-components";
import Modal from './Modal';
import * as FL from './FormLayout';
import * as FE from './FormElements';
import ClienteDropdown from './ClienteDropdown';
import ColaboradorDropdown from './ColaboradorDropdown';
import CostModal from './CostModal';
import BRDateInput from './BRDateInput';
import { formatBRL, parseCurrency } from '../utils/currency';
import BRCurrencyInput from './BRCurrencyInput';

const FormGrid = styled.div`
  display: grid;
  gap: var(--space-md, 16px);
`;

const Row = styled.div`
  display: flex;
  gap: var(--space-sm, 12px);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs, 8px) var(--space-sm, 12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background-color: ${({ index }) => (index % 2 === 0 ? "#f9f9f9" : "#fff")};

  .valor {
    white-space: nowrap;
    font-weight: bold;
  }

  button {
    padding: var(--space-xs, 6px) var(--space-sm, 10px);
    font-size: var(--font-size-sm, 0.875rem);
    border-radius: var(--radius-sm, 4px);
    background-color: var(--color-primary, #6C2BB0);
    color: var(--color-surface, #fff);
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--color-primary-700, #5a2390);
    }
  }
`;

const SelectedTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
  th, td { padding: 8px; border-bottom: 1px solid #eee; }
  thead th { background: #f7f7f7; text-align: left; font-weight: 600; }
  tbody td { text-align: left; vertical-align: top; }
`;
const ThServ = styled.th``;
const TdServ = styled.td``;

// removed date picker button; creation date is automatic now

// simplified dropdowns replaced with native selects in the form

export default function ActionModal({ editing, form, onClose, onSubmit, loading }) {
  // local form state to avoid coupling with parent
  const [local, setLocal] = useState({
    name: "",
    client: "",
    paymentMethod: "",
    startDate: "",
    endDate: "",
    dueDate: "",
  });

  const [clientes, setClientes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  // custom dropdowns will manage their own search/filter state

  // selected colaboradores: { _id, nome, codigo, value, pgt, vencimento, pix, bank }
  const [selectedColaboradores, setSelectedColaboradores] = useState([]);
  // extra costs managed like colaboradores inside the modal
  const [selectedCosts, setSelectedCosts] = useState([]);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costInitial, setCostInitial] = useState(null);

  useEffect(() => {
    // init from editing if present
    if (editing) {
      setLocal({
        name: editing.name || "",
        client: editing.client || "",
        paymentMethod: editing.paymentMethod || "",
        startDate: editing.startDate ? String(editing.startDate).split("T")[0] : "",
        endDate: editing.endDate ? String(editing.endDate).split("T")[0] : "",
        dueDate: editing.dueDate ? editing.dueDate.split("T")[0] : "",
      });
      // if editing has staff array, map into selected colaboradores
      if (Array.isArray(editing.staff)) {
        setSelectedColaboradores(editing.staff.map(s => ({
          _id: s._id || s.id || "",
          nome: s.name || s.nome || "",
          codigo: s.codigo || s.code || "",
          value: s.value || s.valor || "",
          pgt: s.pgt || editing.paymentMethod || "",
          pix: s.pix || '',
          bank: s.bank || '',
          vencimento: s.vencimento ? String(s.vencimento).split("T")[0] : (editing.dueDate ? String(editing.dueDate).split("T")[0] : ""),
        })));
      }
      // map existing costs if present
      if (Array.isArray(editing.costs)) {
        setSelectedCosts(editing.costs.map(c => ({
          _id: c._id,
          description: c.description || '',
          value: (c.value ?? ''),
          pgt: c.pgt || editing.paymentMethod || '',
          pix: c.pix || '',
          bank: c.bank || '',
          vencimento: c.vencimento ? String(c.vencimento).split('T')[0] : (editing.dueDate ? String(editing.dueDate).split('T')[0] : ''),
          colaboradorId: c.colaboradorId || '',
          vendorName: c.vendorName || '',
          vendorEmpresa: c.vendorEmpresa || '',
        })));
      }
    } else if (form && form.name) {
      // optional initial values from form prop
      setLocal(prev => ({ ...prev, ...form }));
    }
  }, [editing, form]);

  // compute due date (vencimento) automatically: +15 days, move weekend to monday
  function computeDueDateFrom(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    // add 15 days
    d.setDate(d.getDate() + 15);
    // if saturday (6) -> add 2 days to monday; if sunday (0) -> add 1 day
    const day = d.getDay();
    if (day === 6) d.setDate(d.getDate() + 2);
    if (day === 0) d.setDate(d.getDate() + 1);
    // format YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  useEffect(() => {
    // whenever local.startDate changes, recompute dueDate automatically
    if (local.startDate) {
      const computed = computeDueDateFrom(local.startDate);
      setLocal(l => ({ ...l, dueDate: computed }));
    } else {
      setLocal(l => ({ ...l, dueDate: "" }));
    }
  }, [local.startDate]);

  // Keep colaboradores vencimento defaulted from automatic dueDate when they don't have a value yet
  useEffect(() => {
    if (!local.dueDate) return;
    setSelectedColaboradores(prev => prev.map(s => (!s.vencimento ? { ...s, vencimento: local.dueDate } : s)));
    setSelectedCosts(prev => prev.map(c => (!c.vencimento ? { ...c, vencimento: local.dueDate } : c)));
  }, [local.dueDate]);

  useEffect(() => {
    // fetch clients and colaboradores
    fetch("/api/cliente").then(r => r.json()).then(setClientes).catch(() => setClientes([]));
    fetch("/api/colaborador").then(r => r.json()).then(setColaboradores).catch(() => setColaboradores([]));
  }, []);

  function addColaboradorById(id) {
    if (!id) return;
    const s = colaboradores.find(x => String(x._id) === String(id));
    if (!s) return;
    if (selectedColaboradores.some(x => String(x._id) === String(s._id))) return; // already added
    setSelectedColaboradores(prev => [...prev, { _id: s._id, nome: s.nome || s.name || "", codigo: s.codigo || "", value: "", pgt: "", vencimento: local.dueDate || '' }]);
  }

  // Index-based updates avoid collisions when some entries have empty/duplicate ids
  function removeColaboradorAt(index) {
    setSelectedColaboradores(prev => prev.filter((_, i) => i !== index));
  }
  function updateColaboradorAt(index, patch) {
    setSelectedColaboradores(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  // dropdowns moved to top-level

  // Costs helpers
  function addCostRow() {
    setCostInitial({ description: '', value: '', pgt: '', pix: '', bank: '', vencimento: local.dueDate || '' });
    setCostModalOpen(true);
  }
  function removeCostAt(index) {
    setSelectedCosts(prev => prev.filter((_, i) => i !== index));
  }

  function saveCostFromModal(payload) {
    // payload comes numeric for value; keep editing UX consistent by formatting on insert
    const formatted = {
      ...payload,
      value: formatBRL(Number(payload.value))
    };
    setSelectedCosts(prev => [...prev, formatted]);
    setCostModalOpen(false);
    setCostInitial(null);
  }
  function updateCostAt(index, patch) {
    setSelectedCosts(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  // currency helpers: format on blur to pt-BR style (R$ 1.234,56) and keep raw on change
  // formatBRL / parseCurrency imported from centralized utils


  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: local.name,
      client: local.client,
      paymentMethod: local.paymentMethod,
      startDate: local.startDate,
      endDate: local.endDate,
      dueDate: local.dueDate,
      staff: selectedColaboradores.map(s => ({ _id: s._id, name: s.nome, codigo: s.codigo, value: parseCurrency(s.value), pgt: s.pgt || '', pix: s.pix || '', bank: s.bank || '', vencimento: s.vencimento || '' })),
      costs: selectedCosts
        .filter(c => (c.description || '').trim())
        .map(c => ({ _id: c._id, description: (c.description || '').trim(), value: parseCurrency(c.value), pgt: c.pgt || '', pix: c.pix || '', bank: c.bank || '', vencimento: c.vencimento || '', colaboradorId: c.colaboradorId || '', vendorName: (c.vendorName || ''), vendorEmpresa: (c.vendorEmpresa || '') })),
    };
    onSubmit && onSubmit(payload);
  }

  // filtering is handled inside the dropdown components now

  return (
    <Fragment>
      <Modal onClose={onClose} ariaLabel={editing ? 'Editar Ação' : 'Nova Ação'}>
        <Title>{editing ? 'Editar Ação' : 'Nova Ação'}</Title>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <input
              placeholder="Evento / Nome da ação"
              value={local.name}
              onChange={e => setLocal(l => ({ ...l, name: e.target.value }))}
              required
            />

            <div>
              <FL.Label>Cliente</FL.Label>
              <ClienteDropdown items={clientes} value={local.client} onSelect={id => setLocal(l => ({ ...l, client: id }))} />
            </div>

            <div>
              <FL.Label>Início do Evento</FL.Label>
              <DateInput
                type="date"
                value={local.startDate || ''}
                onChange={e => setLocal(l => ({ ...l, startDate: e.target.value }))}
              />
              <FL.Label>Fim do Evento</FL.Label>
              <DateInput
                type="date"
                value={local.endDate || ''}
                onChange={e => setLocal(l => ({ ...l, endDate: e.target.value }))}
              />
              <FL.Label>Vencimento (automático)</FL.Label>
              <DueDateInput type="date" value={local.dueDate || ''} readOnly />
            </div>

            <div>
              <FL.Label>Selecionar Colaborador (pode selecionar vários)</FL.Label>
              <ColaboradorDropdown items={colaboradores} onSelect={id => addColaboradorById(id)} />
            </div>

            {selectedColaboradores.length > 0 && (
              <div>
                <SelectedTitle>Colaboradores selecionados</SelectedTitle>
                <SelectedTable>
                  <thead>
                    <tr>
                      <ThServ>Colaborador</ThServ>
                      <ThServ>Valor</ThServ>
                      <ThServ>Forma de Pagamento</ThServ>
                      <ThServ>Vencimento</ThServ>
                      <ThServ></ThServ>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedColaboradores.map((s, idx) => (
                      <tr key={`${s._id || s.codigo || s.nome || ''}-${idx}`}>
                        <TdServ>{`${s.codigo ? s.codigo + ' - ' : ''}${s.nome}`}</TdServ>
                        <TdServ>
                          <BRCurrencyInput value={s.value} onChange={(val) => updateColaboradorAt(idx, { value: val })} />
                        </TdServ>
                        <TdServ>
                          <select value={s.pgt || ''} onChange={e => updateColaboradorAt(idx, { pgt: e.target.value })}>
                            <option value="">Selecionar</option>
                            <option value="PIX">PIX</option>
                            <option value="TED">TED</option>
                            <option value="DINHEIRO">DINHEIRO</option>
                            <option value="BOLETO">BOLETO</option>
                          </select>
                        </TdServ>
                        <TdServ>
                          <BRDateInput value={s.vencimento || ''} onChange={(iso) => updateColaboradorAt(idx, { vencimento: iso })} style={{ width: 120 }} />
                        </TdServ>
                        <TdServ>
                          <FL.DropdownButton as="button" type="button" onClick={() => removeColaboradorAt(idx)}>Remover</FL.DropdownButton>
                        </TdServ>
                      </tr>
                    ))}
                  </tbody>
                </SelectedTable>
              </div>
            )}

            {/* Extra Costs Section inside edit modal */}
            <div>
              <SelectedTitle>Custos extras</SelectedTitle>
              <div style={{ marginBottom: 8 }}>
                <FL.DropdownButton as="button" type="button" onClick={addCostRow}>Adicionar custo</FL.DropdownButton>
              </div>
              {selectedCosts.length > 0 && (
                <SelectedTable>
                  <thead>
                    <tr>
                      <ThServ>Nome</ThServ>
                      <ThServ>Empresa</ThServ>
                      <ThServ>Descrição</ThServ>
                      <ThServ>Valor</ThServ>
                      <ThServ>Pgt</ThServ>
                      <ThServ>Banco</ThServ>
                      <ThServ>PIX</ThServ>
                      <ThServ>Vencimento</ThServ>
                      <ThServ>Opções</ThServ>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCosts.map((c, idx) => {
                      const linkId = c.colaboradorId || '';
                      const sel = linkId ? colaboradores.find(s => String(s._id) === String(linkId)) : null;
                      const nome = sel?.nome || c.vendorName || '';
                      const empresa = sel?.empresa || c.vendorEmpresa || '';
                      return (
                        <tr key={`cost-${idx}`}>
                          <TdServ>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select
                                value={c.colaboradorId || ''}
                                onChange={(e) => {
                                  const sid = e.target.value;
                                  const s = colaboradores.find(x => String(x._id) === String(sid));
                                  // Prefill payment details from Colaborador when linked
                                  const nextPix = s?.pix || '';
                                  const nextBank = s ? `${s.banco || ''}${s.conta ? ` ${s.conta}` : ''}`.trim() : (c.bank || '');
                                  const nextPgt = s ? ((s.pix && s.pix.trim()) ? 'PIX' : ((s.banco || s.conta) ? 'TED' : (c.pgt || ''))) : (c.pgt || '');
                                  updateCostAt(idx, {
                                    colaboradorId: sid || '',
                                    vendorName: s ? (s.nome || '') : (c.vendorName || ''),
                                    vendorEmpresa: s ? (s.empresa || '') : (c.vendorEmpresa || ''),
                                    pix: s ? nextPix : (c.pix || ''),
                                    bank: s ? nextBank : (c.bank || ''),
                                    pgt: s ? nextPgt : (c.pgt || ''),
                                  });
                                }}
                              >
                                <option value="">(Sem vínculo)</option>
                                {colaboradores.map(s => (
                                  <option key={s._id} value={s._id}>{`${s.codigo ? s.codigo + ' - ' : ''}${s.nome}${s.empresa ? ` (${s.empresa})` : ''}`}</option>
                                ))}
                              </select>
                              {!(c.colaboradorId) && (
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>Livre</span>
                              )}
                            </div>
                          </TdServ>
                          <TdServ>
                            <BRCurrencyInput value={c.value} onChange={(val) => updateCostAt(idx, { value: val })} />
                          </TdServ>
                          <TdServ>
                            <select value={c.pgt || ''} onChange={e => updateCostAt(idx, { pgt: e.target.value })}>
                              <option value="">Selecionar</option>
                              <option value="PIX">PIX</option>
                              <option value="TED">TED</option>
                              <option value="DINHEIRO">DINHEIRO</option>
                              <option value="BOLETO">BOLETO</option>
                            </select>
                          </TdServ>
                          <TdServ>
                            <input
                              placeholder="Banco/Conta"
                              value={c.bank || ''}
                              onChange={e => updateCostAt(idx, { bank: e.target.value })}
                            />
                          </TdServ>
                          <TdServ>
                            <input
                              placeholder="PIX"
                              value={c.pix || ''}
                              onChange={e => updateCostAt(idx, { pix: e.target.value })}
                            />
                          </TdServ>
                          <TdServ>
                            <BRDateInput value={c.vencimento || ''} onChange={(iso) => updateCostAt(idx, { vencimento: iso })} style={{ width: 120 }} />
                          </TdServ>
                          <TdServ>
                            <FE.ActionsRow>
                              <FE.SmallSecondaryButton type="button" onClick={() => { setCostInitial(c); setCostModalOpen(true); }}>Editar</FE.SmallSecondaryButton>
                              <FE.SmallInlineButton type="button" onClick={() => removeCostAt(idx)}>Remover</FE.SmallInlineButton>
                            </FE.ActionsRow>
                          </TdServ>
                        </tr>
                      );
                    })}
                  </tbody>
                </SelectedTable>
              )}
            </div>

            <FL.Actions>
              <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
              <FE.Button type="submit" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</FE.Button>
            </FL.Actions>
          </FormGrid>
        </form>
      </Modal>
      {/* Cost modal for adding new extra cost from inside edit modal */}
      <CostModal
        open={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        onSubmit={saveCostFromModal}
        initial={costInitial}
      />
    </Fragment>
  );
}

// Styled additions
const Title = styled.h3`
  margin-top: 0;
  font-size: var(--font-size-lg, 1.125rem);
  color: var(--color-primary);
`;
const DateInput = styled.input`
  flex: 1;
  margin-bottom: var(--space-xs, 8px);
  cursor: pointer;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid rgba(0,0,0,0.08);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
`;
const DueDateInput = styled.input`
  width: 100%;
  background: var(--color-muted-surface, #f5f5f5);
  margin-bottom: var(--space-xs, 8px);
  border-radius: var(--radius-sm, 6px);
  border: 1px solid rgba(0,0,0,0.08);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
`;
const SelectedTitle = styled.div`
  font-weight: 600;
  margin-bottom: var(--space-xs, 8px);
`;
// Removed old list layout styles (SelectedItem/SelectedLabel)
const ValueInput = styled.input`
  width: 120px;
`;
const FooterActions = styled.div`
  display: flex;
  gap: var(--space-sm, 8px);
  justify-content: flex-end;
`;


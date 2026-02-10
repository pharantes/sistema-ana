"use client";
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { Select } from '../components/ui';
import BRDateInput from '../components/BRDateInput';
import BRCurrencyInput from '../components/BRCurrencyInput';
import styled from 'styled-components';
import { SmallInputWrap } from '../components/ui/primitives';

// Two column layout for modal content
const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-sm, 12px);
  width: 100%;
`;

const ReadOnlyInput = styled.input`
  background-color: #f0f0f0;
  cursor: not-allowed;
  padding: var(--space-xs, 8px);
  border: 1px solid #ccc;
  border-radius: var(--radius-sm, 4px);
  font-size: 1rem;
`;

const DateInputWrapper = styled(SmallInputWrap)`
  min-width: 160px;
`;

const ParcelaInputWrapper = styled(SmallInputWrap)`
  min-width: 140px;
`;

export default function ContasReceberModal({
  open,
  onClose,
  action,
  receivable,
  clienteDetails,
  onSaved,
}) {
  const [form, setForm] = useState({});
  const [installments, setInstallments] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedActionIds, setSelectedActionIds] = useState([]);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Currency formatting is handled via shared BRCurrencyInput

  // Fetch available actions and clients for both create and edit modes
  useEffect(() => {
    if (!open) return;

    // Determine if we're in create mode (no action and no receivable)
    const createMode = !action && !receivable;
    setIsCreateMode(createMode);

    // Fetch all actions and clients for selection (needed in both modes)
    Promise.all([
      fetch('/api/action').then(r => r.json()),
      fetch('/api/cliente').then(r => r.json())
    ])
      .then(([actions, clients]) => {
        setAvailableActions(actions || []);
        setAvailableClients(clients || []);
      })
      .catch(() => {
        setAvailableActions([]);
        setAvailableClients([]);
      });
  }, [open, action, receivable]);

  useEffect(() => {
    if (!open) return;

    if (isCreateMode) {
      // Initialize empty form for creation
      const initial = {
        id: undefined,
        actionIds: [],
        clientId: '',
        reportDate: new Date().toISOString().slice(0, 10),
        status: 'ABERTO',
        banco: '',
        conta: '',
        formaPgt: '',
        descricao: '',
        recorrente: false,
        parcelas: false,
        qtdeParcela: '',
        valorParcela: '',
        valor: undefined,
        dataVencimento: '',
        dataRecebimento: '',
      };
      setForm(initial);
      setSelectedActionIds([]);
      setInstallments([]);
    } else {
      // Edit mode - existing behavior
      const initial = {
        id: receivable?._id || undefined,
        actionIds: receivable?.actionIds || (action?._id ? [action._id] : []),
        clientId: receivable?.clientId || action?.clientId,
        reportDate: (receivable?.reportDate || action?.date || action?.createdAt) ? new Date(receivable?.reportDate || action?.date || action?.createdAt).toISOString().slice(0, 10) : '',
        status: receivable?.status || 'ABERTO',
        // Admin receiving bank (do not default from client)
        banco: receivable?.banco || '',
        // Prefill these from client if missing so admin can adjust if needed
        conta: receivable?.conta || clienteDetails?.conta || '',
        formaPgt: receivable?.formaPgt || clienteDetails?.formaPgt || '',
        descricao: receivable?.descricao || '',
        recorrente: !!receivable?.recorrente,
        parcelas: !!receivable?.parcelas,
        qtdeParcela: receivable?.qtdeParcela || '',
        valorParcela: receivable?.valorParcela || '',
        valor: receivable?.valor != null ? Number(receivable.valor) : (action?.value != null ? Number(action.value) : undefined),
        dataVencimento: receivable?.dataVencimento ? new Date(receivable.dataVencimento).toISOString().slice(0, 10) : '',
        dataRecebimento: receivable?.dataRecebimento ? new Date(receivable.dataRecebimento).toISOString().slice(0, 10) : '',
      };
      setForm(initial);
      setSelectedActionIds(initial.actionIds);

      // Load existing installments or generate default ones
      if (receivable?.installments && receivable.installments.length > 0) {
        setInstallments(receivable.installments.map(inst => ({
          number: inst.number,
          value: inst.value,
          dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().slice(0, 10) : '',
          status: inst.status || 'ABERTO',
          paidDate: inst.paidDate ? new Date(inst.paidDate).toISOString().slice(0, 10) : ''
        })));
      } else {
        setInstallments([]);
      }
    }
  }, [open, action, receivable, clienteDetails, isCreateMode]);

  // Auto-generate installments when qtdeParcela changes
  useEffect(() => {
    const qty = Number(form.qtdeParcela);
    if (!qty || qty <= 1) {
      setInstallments([]);
      return;
    }

    // Only auto-generate if installments array is empty or length doesn't match
    if (installments.length === qty) return;

    const totalValue = form.valor || 0;
    const valuePerInstallment = totalValue / qty;
    const baseDate = form.dataVencimento ? new Date(form.dataVencimento) : new Date();

    const generated = [];
    for (let i = 0; i < qty; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i); // Monthly intervals

      generated.push({
        number: i + 1,
        value: valuePerInstallment,
        dueDate: dueDate.toISOString().slice(0, 10),
        status: 'ABERTO',
        paidDate: ''
      });
    }
    setInstallments(generated);
  }, [form.qtdeParcela, form.valor, form.dataVencimento]);

  if (!open) return null;

  const update = (patch) => {
    // If clientId is being changed, clear selected actions
    if ('clientId' in patch) {
      setSelectedActionIds([]);
    }
    setForm(f => ({ ...f, ...patch }));
  };

  const updateInstallment = (index, patch) => {
    setInstallments(prev => prev.map((inst, i) =>
      i === index ? { ...inst, ...patch } : inst
    ));
  };

  const submit = async () => {
    // Build a cleaned payload: coerce numeric fields and strip empty strings
    const payload = { ...form };

    // Ensure actionIds is set
    payload.actionIds = selectedActionIds;

    if (!payload.actionIds || payload.actionIds.length === 0) {
      alert('Por favor, selecione pelo menos uma ação');
      return;
    }

    // Ensure clientId is set
    if (!payload.clientId || payload.clientId === '') {
      alert('Por favor, selecione um cliente');
      return;
    }

    // qtdeParcela should be a number >= 1 or undefined
    if (payload.qtdeParcela === '' || payload.qtdeParcela == null) delete payload.qtdeParcela;
    else payload.qtdeParcela = Number(payload.qtdeParcela);
    // monetary fields: convert to numbers or remove
    if (payload.valorParcela === '' || payload.valorParcela == null) delete payload.valorParcela;
    else payload.valorParcela = Number(payload.valorParcela);
    if (payload.valor === '' || payload.valor == null) delete payload.valor;
    else payload.valor = Number(payload.valor);

    // Include installments if qtdeParcela > 1
    if (payload.qtdeParcela && payload.qtdeParcela > 1 && installments.length > 0) {
      payload.installments = installments.map(inst => ({
        number: inst.number,
        value: Number(inst.value),
        dueDate: inst.dueDate,
        status: inst.status,
        paidDate: inst.paidDate || undefined
      }));
    }

    const method = isCreateMode ? 'POST' : 'PATCH';
    const res = await fetch('/api/contasareceber', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || 'Falha ao salvar');
      return;
    }
    const saved = await res.json();
    if (onSaved) onSaved(saved);
    if (onClose) onClose();
  };

  return (
    <Modal onClose={onClose} ariaLabel="Editar Conta a Receber">
      <Title>{isCreateMode ? 'Nova Conta a Receber' : 'Editar Conta a Receber'}</Title>

      <label>Cliente *</label>
      <Select
        value={form.clientId || ''}
        onChange={e => update({ clientId: e.target.value })}
      >
        <option value="">Selecione um cliente</option>
        {availableClients.map(client => (
          <option key={client._id} value={client._id}>
            {client.codigo ? `${client.codigo} - ` : ''}{client.nome}
          </option>
        ))}
      </Select>

      <label>Ações (selecione uma ou mais) *</label>
      <ActionsSelector>
        {availableActions
          .filter(act => !form.clientId || act.client === form.clientId)
          .map(act => (
            <ActionCheckboxItem key={act._id}>
              <input
                type="checkbox"
                checked={selectedActionIds.includes(act._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedActionIds(prev => [...prev, act._id]);
                  } else {
                    setSelectedActionIds(prev => prev.filter(id => id !== act._id));
                  }
                }}
              />
              <span>{act.name || act.event || 'Sem nome'} - {act.clientName || act.client || ''}</span>
            </ActionCheckboxItem>
          ))}
      </ActionsSelector>
      {selectedActionIds.length > 0 && (
        <Note>{selectedActionIds.length} ação(ões) selecionada(s)</Note>
      )}

      <label>Status {Number(form.qtdeParcela) > 1 && installments.length > 0 && '(calculado automaticamente)'}</label>
      {Number(form.qtdeParcela) > 1 && installments.length > 0 ? (
        <ReadOnlyInput
          readOnly
          value={form.status || 'ABERTO'}
          title="Status calculado automaticamente baseado nas parcelas individuais. Edite as parcelas abaixo."
        />
      ) : (
        <Select value={form.status || 'ABERTO'} onChange={e => update({ status: e.target.value })}>
          <option value="ABERTO">ABERTO</option>
          <option value="RECEBIDO">RECEBIDO</option>
        </Select>
      )}

      <TwoCol>
        <div>
          <label>Data do documento</label>
          <DateInputWrapper>
            <BRDateInput value={form.reportDate || ''} onChange={(iso) => update({ reportDate: iso })} />
          </DateInputWrapper>
        </div>
        <div />
      </TwoCol>

      {!isCreateMode && (
        <>
          <label>Banco (Cliente)</label>
          <input readOnly value={clienteDetails?.banco || ''} />

          <label>Conta (Cliente)</label>
          <input readOnly value={clienteDetails?.conta || ''} />

          <label>Forma Pgt (Cliente)</label>
          <input readOnly value={clienteDetails?.formaPgt || ''} />
        </>
      )}

      <label>Descrição</label>
      <input value={form.descricao || ''} onChange={e => update({ descricao: e.target.value })} />

      {/* Radios removidos conforme nova instrução */}

      <label>Recebido pelo banco</label>
      <input value={form.banco || ''} onChange={e => update({ banco: e.target.value })} />

      <TwoCol>
        <div>
          <label>Valor total</label>
          <BRCurrencyInput value={form.valor} onChange={(n) => update({ valor: n })} />

          <label>Qtde parcela</label>
          <input type="number" value={form.qtdeParcela ?? ''} onChange={e => update({ qtdeParcela: e.target.value })} />

          <label>Data de vencimento</label>
          <DateInputWrapper>
            <BRDateInput value={form.dataVencimento || ''} onChange={(iso) => update({ dataVencimento: iso })} />
          </DateInputWrapper>
        </div>
        <div>
          <label>Valor da parcela</label>
          <BRCurrencyInput value={form.valorParcela} onChange={(n) => update({ valorParcela: n })} />

          <label>Recebido pelo banco</label>
          <input value={form.banco || ''} onChange={e => update({ banco: e.target.value })} />

          <label>Data de recebimento</label>
          <SmallInputWrap style={{ minWidth: 160 }}>
            <BRDateInput value={form.dataRecebimento || ''} onChange={(iso) => update({ dataRecebimento: iso })} />
          </SmallInputWrap>
        </div>
      </TwoCol>

      {/* Installments Editor - shown when qtdeParcela > 1 */}
      {Number(form.qtdeParcela) > 1 && installments.length > 0 && (
        <InstallmentsSection>
          <SectionTitle>Parcelas Individuais</SectionTitle>
          <InstallmentsTable>
            <thead>
              <tr>
                <th>#</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Data Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst, idx) => (
                <tr key={idx}>
                  <td>{inst.number}</td>
                  <td>
                    <BRCurrencyInput
                      value={inst.value}
                      onChange={(n) => updateInstallment(idx, { value: n })}
                    />
                  </td>
                  <td>
                    <ParcelaInputWrapper>
                      <BRDateInput
                        value={inst.dueDate || ''}
                        onChange={(iso) => updateInstallment(idx, { dueDate: iso })}
                      />
                    </ParcelaInputWrapper>
                  </td>
                  <td>
                    <Select
                      value={inst.status || 'ABERTO'}
                      onChange={e => updateInstallment(idx, { status: e.target.value })}
                    >
                      <option value="ABERTO">ABERTO</option>
                      <option value="RECEBIDO">RECEBIDO</option>
                    </Select>
                  </td>
                  <td>
                    <ParcelaInputWrapper>
                      <BRDateInput
                        value={inst.paidDate || ''}
                        onChange={(iso) => updateInstallment(idx, { paidDate: iso })}
                      />
                    </ParcelaInputWrapper>
                  </td>
                </tr>
              ))}
            </tbody>
          </InstallmentsTable>
          <Note>* O status geral será RECEBIDO apenas quando todas as parcelas estiverem RECEBIDO</Note>
        </InstallmentsSection>
      )}

      <FooterRow>
        <button type="button" onClick={onClose}>Cancelar</button>
        <button onClick={submit}>Salvar</button>
      </FooterRow>
    </Modal>
  );
}
const Title = styled.h1`
  font-size: var(--font-h2, var(--font-size-lg, 1.125rem));
  margin-bottom: var(--space-md, var(--space-sm, var(--space-sm, 12px)));
`;
// Layout handled by TwoCol; FieldRow and Flex1 removed

const FooterRow = styled.div`
  display: flex;
  gap: var(--gap-xs, var(--gap-xs, var(--gap-xs, 6px)));
  justify-content: flex-end;
  margin-top: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;

const InstallmentsSection = styled.div`
  margin-top: var(--space-md, 16px);
  padding: var(--space-md, 16px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-sm, 4px);
  background-color: #f9f9f9;
`;

const SectionTitle = styled.h3`
  font-size: var(--font-size-md, 1rem);
  margin-bottom: var(--space-sm, 12px);
  color: var(--color-primary, #6C2BB0);
`;

const InstallmentsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--space-sm, 12px);
  
  th, td {
    padding: var(--space-xs, 8px);
    text-align: left;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  th {
    background-color: rgba(108, 43, 176, 0.1);
    font-weight: 600;
    font-size: var(--font-size-sm, 0.875rem);
  }
  
  tbody tr:hover {
    background-color: rgba(108, 43, 176, 0.05);
  }
  
  input, select {
    width: 100%;
    padding: var(--space-xs, 6px);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-sm, 0.875rem);
  }
`;

const Note = styled.p`
  font-size: var(--font-size-sm, 0.875rem);
  color: #666;
  font-style: italic;
  margin: 0;
`;

const ActionsSelector = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm, 4px);
  background-color: #fff;
`;

const ActionCheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(108, 43, 176, 0.05);
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: #333;
  }
`;


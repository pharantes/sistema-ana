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

export default function ContasReceberModal({
  open,
  onClose,
  action,
  receivable,
  clienteDetails,
  onSaved,
}) {
  const [form, setForm] = useState({});

  // Currency formatting is handled via shared BRCurrencyInput

  useEffect(() => {
    if (!open) return;
    const initial = {
      id: receivable?._id || undefined,
      actionId: action?._id,
      clientId: action?.clientId,
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
  }, [open, action, receivable, clienteDetails]);

  if (!open) return null;

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const submit = async () => {
    // Build a cleaned payload: coerce numeric fields and strip empty strings
    const payload = { ...form };
    // qtdeParcela should be a number >= 1 or undefined
    if (payload.qtdeParcela === '' || payload.qtdeParcela == null) delete payload.qtdeParcela;
    else payload.qtdeParcela = Number(payload.qtdeParcela);
    // monetary fields: convert to numbers or remove
    if (payload.valorParcela === '' || payload.valorParcela == null) delete payload.valorParcela;
    else payload.valorParcela = Number(payload.valorParcela);
    if (payload.valor === '' || payload.valor == null) delete payload.valor;
    else payload.valor = Number(payload.valor);

    const res = await fetch('/api/contasareceber', {
      method: 'PATCH',
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
      <Title>Conta a Receber</Title>

      <label>Status</label>
      <Select value={form.status || 'ABERTO'} onChange={e => update({ status: e.target.value })}>
        <option value="ABERTO">ABERTO</option>
        <option value="RECEBIDO">RECEBIDO</option>
      </Select>

      <TwoCol>
        <div>
          <label>Data do documento</label>
          <SmallInputWrap style={{ minWidth: 160 }}>
            <BRDateInput value={form.reportDate || ''} onChange={(iso) => update({ reportDate: iso })} />
          </SmallInputWrap>
        </div>
        <div />
      </TwoCol>

      <label>Ação</label>
      <input readOnly value={action?.name || ''} />

      <label>Cliente</label>
      <input readOnly value={action?.clientName || ''} />

      <label>Banco (Cliente)</label>
      <input readOnly value={clienteDetails?.banco || ''} />

      <label>Conta (Cliente)</label>
      <input readOnly value={clienteDetails?.conta || ''} />

      <label>Forma Pgt (Cliente)</label>
      <input readOnly value={clienteDetails?.formaPgt || ''} />

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
          <SmallInputWrap style={{ minWidth: 160 }}>
            <BRDateInput value={form.dataVencimento || ''} onChange={(iso) => update({ dataVencimento: iso })} />
          </SmallInputWrap>
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



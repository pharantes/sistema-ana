"use client";
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';

export default function ContasReceberModal({
  open,
  onClose,
  action,
  receivable,
  clienteDetails,
  onSaved,
}) {
  const [form, setForm] = useState({});

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
      valor: receivable?.valor || action?.value || '',
      dataVencimento: receivable?.dataVencimento ? new Date(receivable.dataVencimento).toISOString().slice(0, 10) : '',
      dataRecebimento: receivable?.dataRecebimento ? new Date(receivable.dataRecebimento).toISOString().slice(0, 10) : '',
    };
    setForm(initial);
  }, [open, action, receivable, clienteDetails]);

  if (!open) return null;

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const submit = async () => {
    const res = await fetch('/api/contasareceber', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
      <h2 style={{ marginTop: 0 }}>Conta a Receber</h2>

      <label>Data do documento</label>
      <input type="date" value={form.reportDate || ''} onChange={e => update({ reportDate: e.target.value })} />

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

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '8px 0' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="radio" name="tipo" checked={!!form.recorrente} onChange={() => update({ recorrente: true, parcelas: false })} />
          Recorrente
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="radio" name="tipo" checked={!!form.parcelas} onChange={() => update({ recorrente: false, parcelas: true })} />
          Parcelas
        </label>
      </div>

      <label>Recebido pelo banco</label>
      <input value={form.banco || ''} onChange={e => update({ banco: e.target.value })} />

      <label>Valor</label>
      <input type="number" step="0.01" value={form.valor ?? ''} onChange={e => update({ valor: e.target.value })} />

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Qtde parcela</label>
          <input type="number" value={form.qtdeParcela ?? ''} onChange={e => update({ qtdeParcela: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Valor da parcela</label>
          <input type="number" step="0.01" value={form.valorParcela ?? ''} onChange={e => update({ valorParcela: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Data de vencimento</label>
          <input type="date" value={form.dataVencimento || ''} onChange={e => update({ dataVencimento: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Data de recebimento</label>
          <input type="date" value={form.dataRecebimento || ''} onChange={e => update({ dataRecebimento: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button type="button" onClick={onClose}>Cancelar</button>
        <button onClick={submit}>Salvar</button>
      </div>
    </Modal>
  );
}

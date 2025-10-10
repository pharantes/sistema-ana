"use client";
/* eslint-env browser */
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';
import ColaboradorModal from './ColaboradorModal';

const Title = styled.h2`
  margin-bottom: 12px;
`;

export default function CostModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({ description: '', value: '', pix: '', bank: '', pgt: '', vencimento: '', colaboradorId: '', vendorName: '', vendorEmpresa: '' });
  const [colaboradores, setColaboradores] = useState([]);
  const [colabModalOpen, setColabModalOpen] = useState(false);
  const [colabEditing, setColabEditing] = useState(null);

  useEffect(() => {
    if (initial) {
      setForm({
        description: initial.description || '',
        value: initial.value != null ? Number(initial.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        pix: initial.pix || '',
        bank: initial.bank || '',
        pgt: initial.pgt || '',
        vencimento: initial.vencimento ? String(initial.vencimento).slice(0, 10) : '',
        colaboradorId: initial.colaboradorId || '',
        vendorName: initial.vendorName || '',
        vendorEmpresa: initial.vendorEmpresa || '',
      });
    }
  }, [initial]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/colaborador')
      .then(r => r.json())
      .then(setColaboradores)
      .catch(() => setColaboradores([]));
  }, [open]);

  const parseCurrency = (value) => {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  function handleSubmit(e) {
    e.preventDefault();
    const amount = parseCurrency(form.value);
    if (!form.description.trim()) return; // native required handles this too
    if (!form.colaboradorId && !form.vendorName.trim()) {
      try { globalThis.alert('Informe o Nome do fornecedor ou vincule um Colaborador.'); } catch { /* noop */ }
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      try { globalThis.alert('Informe um Valor válido maior que zero.'); } catch { /* noop */ }
      return;
    }
    const payload = {
      description: form.description.trim(),
      value: amount,
      pix: form.pix.trim(),
      bank: form.bank.trim(),
      pgt: form.pgt.trim(),
      vencimento: form.vencimento || '',
      colaboradorId: form.colaboradorId || '',
      vendorName: form.colaboradorId ? '' : (form.vendorName || '').trim(),
      vendorEmpresa: form.colaboradorId ? '' : (form.vendorEmpresa || '').trim(),
    };
    onSubmit && onSubmit(payload);
  }

  if (!open) return null;
  const isEdit = !!(initial && (initial._id || initial.description));
  return (
    <Modal onClose={onClose} ariaLabel={isEdit ? 'Editar Custo' : 'Novo Custo'}>
      <Title>{isEdit ? 'Editar Custo' : 'Novo Custo'}</Title>
      <FL.FormGrid as="form" onSubmit={handleSubmit}>
        <div>
          <FL.Label>Vincular a Colaborador</FL.Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={form.colaboradorId} onChange={e => {
              const sid = e.target.value;
              const sel = colaboradores.find(s => String(s._id) === String(sid));
              // Prefill vendor and payment fields from selected Colaborador
              const nextPix = sel?.pix || '';
              const nextBank = sel ? `${sel.banco || ''}${sel.conta ? ` ${sel.conta}` : ''}`.trim() : form.bank;
              // Heuristic default for Pgt: prefer PIX when pix exists, else TED when bank/conta exists
              const nextPgt = sel ? ((sel.pix && sel.pix.trim()) ? 'PIX' : ((sel.banco || sel.conta) ? 'TED' : (form.pgt || ''))) : (form.pgt || '');
              setForm(f => ({
                ...f,
                colaboradorId: sid,
                vendorName: sel ? (sel.nome || '') : f.vendorName,
                vendorEmpresa: sel ? (sel.empresa || '') : f.vendorEmpresa,
                pix: sel ? nextPix : f.pix,
                bank: sel ? nextBank : f.bank,
                pgt: sel ? nextPgt : f.pgt,
              }));
            }}>
              <option value="">Nenhum (custo livre)</option>
              {colaboradores.map(s => (
                <option key={s._id} value={s._id}>{`${s.codigo} - ${s.nome}${s.empresa ? ` (${s.empresa})` : ''}`}</option>
              ))}
            </select>
            <FE.SecondaryButton type="button" onClick={() => { setColabEditing(null); setColabModalOpen(true); }}>Novo Colaborador</FE.SecondaryButton>
          </div>
        </div>
        {!form.colaboradorId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <FL.Label>Nome</FL.Label>
              <input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <FL.Label>Empresa</FL.Label>
              <input value={form.vendorEmpresa} onChange={e => setForm(f => ({ ...f, vendorEmpresa: e.target.value }))} placeholder="Empresa (opcional)" />
            </div>
          </div>
        )}
        <div>
          <FL.Label>Descrição</FL.Label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>
        <div>
          <FL.Label>Valor</FL.Label>
          <input
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            onBlur={e => setForm(f => ({ ...f, value: Number(parseCurrency(e.target.value)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }))}
            placeholder="R$"
            required
          />
        </div>
        <div>
          <FL.Label>PIX</FL.Label>
          <input value={form.pix} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))} />
        </div>
        <div>
          <FL.Label>Banco</FL.Label>
          <input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
        </div>
        <div>
          <FL.Label>Pgt</FL.Label>
          <select value={form.pgt} onChange={e => setForm(f => ({ ...f, pgt: e.target.value }))}>
            <option value="">Selecionar</option>
            <option value="PIX">PIX</option>
            <option value="TED">TED</option>
            <option value="DINHEIRO">DINHEIRO</option>
            <option value="BOLETO">BOLETO</option>
          </select>
        </div>
        <div>
          <FL.Label>Vencimento</FL.Label>
          <input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
        </div>
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit">Salvar</FE.Button>
        </FL.Actions>
      </FL.FormGrid>
      {colabModalOpen && (
        <ColaboradorModal
          open={colabModalOpen}
          onClose={() => setColabModalOpen(false)}
          initial={colabEditing}
          onSubmit={async (novo) => {
            try {
              const method = novo._id ? 'PATCH' : 'POST';
              const body = novo._id ? { ...novo } : novo;
              if (method === 'PATCH') body._id = novo._id;
              const res = await fetch('/api/colaborador', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              const data = await res.json();
              if (data && data._id) {
                setColabModalOpen(false);
                // refetch
                const list = await fetch('/api/colaborador').then(r => r.json()).catch(() => []);
                setColaboradores(list);
                // Prefill fields from the newly created/updated colaborador
                const nextPix = data?.pix || '';
                const nextBank = `${data?.banco || ''}${data?.conta ? ` ${data.conta}` : ''}`.trim();
                const nextPgt = (data?.pix && String(data.pix).trim()) ? 'PIX' : ((data?.banco || data?.conta) ? 'TED' : '');
                setForm(f => ({
                  ...f,
                  colaboradorId: data._id,
                  vendorName: data.nome || '',
                  vendorEmpresa: data.empresa || '',
                  pix: nextPix,
                  bank: nextBank,
                  pgt: nextPgt || f.pgt,
                }));
              } else {
                try { alert(data.error || 'Falha ao salvar colaborador'); } catch { /* ignore */ }
              }
            } catch {
              try { alert('Falha ao salvar colaborador'); } catch { /* ignore */ }
            }
          }}
        />
      )}
    </Modal>
  );
}

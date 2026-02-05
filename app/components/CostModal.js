"use client";
/* eslint-env browser */
import { useState, useEffect } from 'react';
import BRDateInput from './BRDateInput';
import styled from 'styled-components';
import { GridTwoGap, SmallInputWrap, ActionsInline } from './ui/primitives';
import Modal from './Modal';
import * as FE from './FormElements';
import * as FL from './FormLayout';
import ColaboradorModal from './ColaboradorModal';
import ErrorModal from './ErrorModal';
import { parseCurrency } from '../utils/currency';
import BRCurrencyInput from './BRCurrencyInput';

const Title = styled.h2`
  margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;

/**
 * Creates empty cost form state
 */
function createEmptyCostForm() {
  return {
    description: '',
    value: undefined,
    pix: '',
    bank: '',
    pgt: '',
    vencimento: '',
    colaboradorId: '',
    vendorName: '',
    vendorEmpresa: '',
  };
}

/**
 * Maps initial cost data to form state
 */
function mapInitialToForm(initial) {
  return {
    description: initial.description || '',
    value: initial.value != null ? Number(initial.value) : undefined,
    pix: initial.pix || '',
    bank: initial.bank || '',
    pgt: initial.pgt || '',
    vencimento: initial.vencimento ? String(initial.vencimento).slice(0, 10) : '',
    colaboradorId: initial.colaboradorId || '',
    vendorName: initial.vendorName || '',
    vendorEmpresa: initial.vendorEmpresa || '',
  };
}

/**
 * Formats bank information from colaborador
 */
function formatBankInfoFromColaborador(colaborador) {
  if (!colaborador) return '';
  const banco = colaborador.banco || '';
  const conta = colaborador.conta || '';
  return `${banco}${conta ? ` ${conta}` : ''}`.trim();
}

/**
 * Determines default payment method from colaborador data
 */
function determinePaymentMethod(colaborador, fallback) {
  if (!colaborador) return fallback || '';

  const hasPix = colaborador.pix && String(colaborador.pix).trim();
  const hasBankAccount = colaborador.banco || colaborador.conta;

  if (hasPix) return 'PIX';
  if (hasBankAccount) return 'TED';
  return fallback || '';
}

/**
 * CostModal - Form modal for creating and editing action costs
 */
export default function CostModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(createEmptyCostForm());
  const [colaboradores, setColaboradores] = useState([]);
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });

  useEffect(() => {
    if (initial) {
      setForm(mapInitialToForm(initial));
    }
  }, [initial]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/colaborador')
      .then(r => r.json())
      .then(setColaboradores)
      .catch(() => setColaboradores([]));
  }, [open]);

  /**
   * Validates that vendor information is provided
   */
  function validateVendorInfo() {
    if (form.colaboradorId) return true;
    if (form.vendorName.trim()) return true;

    setErrorModal({ open: true, message: 'Informe o Nome do fornecedor ou vincule um Colaborador.' });
    return false;
  }

  /**
   * Validates that amount is valid and positive
   */
  function validateAmount(amount) {
    if (Number.isFinite(amount) && amount > 0) return true;

    setErrorModal({ open: true, message: 'Informe um Valor válido maior que zero.' });
    return false;
  }

  /**
   * Builds cost payload for submission
   */
  function buildCostPayload(amount) {
    return {
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
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.description.trim()) return;

    const amount = parseCurrency(form.value);

    if (!validateVendorInfo()) return;
    if (!validateAmount(amount)) return;

    const payload = buildCostPayload(amount);
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
          <ActionsInline>
            <select value={form.colaboradorId} onChange={e => {
              const selectedId = e.target.value;
              const selectedColaborador = colaboradores.find(
                c => String(c._id) === String(selectedId)
              );

              if (selectedColaborador) {
                setForm(previousForm => ({
                  ...previousForm,
                  colaboradorId: selectedId,
                  vendorName: selectedColaborador.nome || '',
                  vendorEmpresa: selectedColaborador.empresa || '',
                  pix: selectedColaborador.pix || '',
                  bank: formatBankInfoFromColaborador(selectedColaborador),
                  pgt: determinePaymentMethod(selectedColaborador, previousForm.pgt),
                }));
              } else {
                setForm(previousForm => ({
                  ...previousForm,
                  colaboradorId: selectedId,
                }));
              }
            }}>
              <option value="">Nenhum (custo livre)</option>
              {colaboradores.map(s => (
                <option key={s._id} value={s._id}>{`${s.codigo} - ${s.nome}${s.empresa ? ` (${s.empresa})` : ''}`}</option>
              ))}
            </select>
            <FE.SecondaryButton type="button" onClick={() => {
              setEditingColaborador(null);
              setIsColabModalOpen(true);
            }}>Novo Colaborador</FE.SecondaryButton>
          </ActionsInline>
        </div>
        {!form.colaboradorId && (
          <GridTwoGap>
            <div>
              <FL.Label>Nome</FL.Label>
              <input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <FL.Label>Empresa</FL.Label>
              <input value={form.vendorEmpresa} onChange={e => setForm(f => ({ ...f, vendorEmpresa: e.target.value }))} placeholder="Empresa (opcional)" />
            </div>
          </GridTwoGap>
        )}
        <div>
          <FL.Label>Descrição</FL.Label>
          <FE.Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>
        <div>
          <FL.Label>Valor</FL.Label>
          <BRCurrencyInput value={form.value} onChange={(val) => setForm(f => ({ ...f, value: val }))} required />
        </div>
        <div>
          <FL.Label>PIX</FL.Label>
          <FE.Input value={form.pix} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))} />
        </div>
        <div>
          <FL.Label>Banco</FL.Label>
          <FE.Input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
        </div>
        <div>
          <FL.Label>Pgt</FL.Label>
          <FE.Select value={form.pgt} onChange={e => setForm(f => ({ ...f, pgt: e.target.value }))}>
            <option value="">Selecionar</option>
            <option value="PIX">PIX</option>
            <option value="TED">TED</option>
            <option value="DINHEIRO">DINHEIRO</option>
            <option value="BOLETO">BOLETO</option>
          </FE.Select>
        </div>
        <div>
          <FL.Label>Vencimento</FL.Label>
          <SmallInputWrap>
            <BRDateInput value={form.vencimento} onChange={(iso) => setForm(f => ({ ...f, vencimento: iso }))} />
          </SmallInputWrap>
        </div>
        <FL.Actions>
          <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
          <FE.Button type="submit">Salvar</FE.Button>
        </FL.Actions>
      </FL.FormGrid>
      {isColabModalOpen && (
        <ColaboradorModal
          open={isColabModalOpen}
          onClose={() => setIsColabModalOpen(false)}
          initial={editingColaborador}
          onSubmit={async (newColaborador) => {
            try {
              const method = newColaborador._id ? 'PATCH' : 'POST';
              const body = newColaborador._id ? { ...newColaborador } : newColaborador;
              if (method === 'PATCH') body._id = newColaborador._id;

              const res = await fetch('/api/colaborador', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              const data = await res.json();

              if (data && data._id) {
                setIsColabModalOpen(false);

                // Refetch colaboradores list
                const updatedList = await fetch('/api/colaborador')
                  .then(r => r.json())
                  .catch(() => []);
                setColaboradores(updatedList);

                // Prefill form with new colaborador data
                setForm(previousForm => ({
                  ...previousForm,
                  colaboradorId: data._id,
                  vendorName: data.nome || '',
                  vendorEmpresa: data.empresa || '',
                  pix: data.pix || '',
                  bank: formatBankInfoFromColaborador(data),
                  pgt: determinePaymentMethod(data, previousForm.pgt),
                }));
              } else {
                setErrorModal({ open: true, message: data.error || 'Falha ao salvar colaborador' });
              }
            } catch {
              setErrorModal({ open: true, message: 'Falha ao salvar colaborador. Verifique sua conexão e tente novamente.' });
            }
          }}
        />
      )}
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        message={errorModal.message}
      />
    </Modal>
  );
}

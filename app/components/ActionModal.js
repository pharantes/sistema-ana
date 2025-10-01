"use client";
import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import Modal from './Modal';
import * as FL from './FormLayout';
import * as FE from './FormElements';

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

const SelectedList = styled.ul`
  list-style: none;
  padding: var(--space-sm, 12px);
  margin: 0;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.5;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-sm, 4px);
  overflow-x: hidden;
`;

const CalendarButton = styled.button`
  padding: var(--space-xs, 8px);
  border-radius: var(--radius-sm, 6px);
  background: var(--color-primary, #6C2BB0);
  color: var(--color-surface, #fff);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  box-shadow: 0 2px 8px rgba(108,43,176,0.08);
  &:hover { opacity: 0.95; }
  &:focus { outline: 2px solid var(--color-primary-700, #5a2390); }
`;

export default function ActionModal({ editing, form, setForm, staffRows, setStaffRows, onClose, onSubmit, loading }) {
  // local form state to avoid coupling with parent
  const [local, setLocal] = useState({
    name: "",
    client: "",
    paymentMethod: "",
    date: "",
    dueDate: "",
  });

  const [clientes, setClientes] = useState([]);
  const [servidores, setServidores] = useState([]);

  // custom dropdowns will manage their own search/filter state

  // selected servidores: { _id, nome, codigo, value }
  const [selectedServidores, setSelectedServidores] = useState([]);

  useEffect(() => {
    // init from editing if present
    if (editing) {
      setLocal({
        name: editing.name || "",
        client: editing.client || "",
        paymentMethod: editing.paymentMethod || "",
        date: editing.date ? editing.date.split("T")[0] : "",
        dueDate: editing.dueDate ? editing.dueDate.split("T")[0] : "",
      });
      // if editing has staff array, map into selectedServidores
      if (Array.isArray(editing.staff)) {
        setSelectedServidores(editing.staff.map(s => ({
          _id: s._id || s.id || "",
          nome: s.name || s.nome || "",
          codigo: s.codigo || s.code || "",
          value: s.value || s.valor || "",
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
    // whenever local.date changes, recompute dueDate automatically
    if (local.date) {
      const computed = computeDueDateFrom(local.date);
      setLocal(l => ({ ...l, dueDate: computed }));
    } else {
      setLocal(l => ({ ...l, dueDate: "" }));
    }
  }, [local.date]);

  useEffect(() => {
    // fetch clients and servers
    fetch("/api/cliente").then(r => r.json()).then(setClientes).catch(() => setClientes([]));
    fetch("/api/servidor").then(r => r.json()).then(setServidores).catch(() => setServidores([]));
  }, []);

  function addServidorById(id) {
    if (!id) return;
    const s = servidores.find(x => String(x._id) === String(id));
    if (!s) return;
    if (selectedServidores.some(x => String(x._id) === String(s._id))) return; // already added
    setSelectedServidores(prev => [...prev, { _id: s._id, nome: s.nome || s.name || "", codigo: s.codigo || "", value: "" }]);
  }

  function removeServidor(id) {
    setSelectedServidores(prev => prev.filter(p => String(p._id) !== String(id)));
  }

  function setServidorValue(id, value) {
    setSelectedServidores(prev => prev.map(p => p._id === id ? { ...p, value } : p));
  }

  // custom dropdown that shows a search input inside the opened panel
  function ClienteDropdown({ items, value, onSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlight, setHighlight] = useState(0);
    const ref = useRef();
    const inputRef = useRef();
    useEffect(() => {
      function onDoc(e) {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
      if (open && inputRef.current) {
        try { inputRef.current.focus(); } catch (err) { }
      }
    }, [open]);

    const label = items.find(i => String(i._id) === String(value));

    const filtered = items.filter(c => {
      if (!search) return true;
      return String(c.nome || '').toLowerCase().includes(search.toLowerCase()) || String(c.codigo || '').includes(search);
    });

    return (
      <FL.DropdownWrapper ref={ref}>
        <FL.DropdownButton type="button" onClick={() => setOpen(v => !v)}>
          {label ? `${label.codigo || ''} ${label.nome || label.name}` : '-- selecione o cliente --'}
        </FL.DropdownButton>
        {open && (
          <FL.DropdownPanel role="listbox" aria-label="Clientes">
            <FL.DropdownInput
              ref={inputRef}
              placeholder='Buscar cliente...'
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlight(0); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(i => Math.min(i + 1, filtered.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(i => Math.max(i - 1, 0)); }
                if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) { onSelect(filtered[highlight]._id); setOpen(false); } }
                if (e.key === 'Escape') { setOpen(false); }
              }}
            />
            <div>
              {filtered.map((c, idx) => (
                <FL.OptionItem
                  role="option"
                  aria-selected={idx === highlight}
                  key={c._id}
                  onClick={() => { onSelect(c._id); setOpen(false); }}
                  onMouseEnter={() => setHighlight(idx)}
                  $highlight={idx === highlight}
                >
                  {`${c.codigo || ''} ${c.nome || c.name}`}
                </FL.OptionItem>
              ))}
              {filtered.length === 0 && <FL.EmptyMessage>Nenhum cliente</FL.EmptyMessage>}
            </div>
          </FL.DropdownPanel>
        )}
      </FL.DropdownWrapper>
    );
  }

  function ServidorDropdown({ items, onSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlight, setHighlight] = useState(0);
    const ref = useRef();
    const inputRef = useRef();
    useEffect(() => {
      function onDoc(e) {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
      if (open && inputRef.current) {
        try { inputRef.current.focus(); } catch (err) { }
      }
    }, [open]);

    const filtered = items.filter(s => {
      if (!search) return true;
      return String(s.nome || s.name || '').toLowerCase().includes(search.toLowerCase()) || String(s.codigo || '').includes(search);
    });

    return (
      <FL.DropdownWrapper ref={ref}>
        <FL.DropdownButton type="button" onClick={() => setOpen(v => !v)}>
          -- selecione um servidor --
        </FL.DropdownButton>
        {open && (
          <FL.DropdownPanel role="listbox" aria-label="Servidores">
            <FL.DropdownInput
              ref={inputRef}
              placeholder='Buscar servidor...'
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlight(0); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(i => Math.min(i + 1, filtered.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(i => Math.max(i - 1, 0)); }
                if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) { onSelect(filtered[highlight]._id); setOpen(false); } }
                if (e.key === 'Escape') { setOpen(false); }
              }}
            />
            <div>
              {filtered.map((s, idx) => (
                <FL.OptionItem
                  role="option"
                  aria-selected={idx === highlight}
                  key={s._id}
                  onClick={() => { onSelect(s._id); setOpen(false); }}
                  onMouseEnter={() => setHighlight(idx)}
                  $highlight={idx === highlight}
                >
                  {`${s.codigo || ''} ${s.nome || s.name}`}
                </FL.OptionItem>
              ))}
              {filtered.length === 0 && <FL.EmptyMessage>Nenhum servidor</FL.EmptyMessage>}
            </div>
          </FL.DropdownPanel>
        )}
      </FL.DropdownWrapper>
    );
  }

  // currency helpers: format on blur to pt-BR style (R$ 1.234,56) and keep raw on change
  function formatBRL(value) {
    if (value == null || value === '') return '';
    // attempt to parse numbers from value then format
    const n = Number(String(value).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(n)) return '';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseCurrency(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }


  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: local.name,
      client: local.client,
      paymentMethod: local.paymentMethod,
      date: local.date,
      dueDate: local.dueDate,
      staff: selectedServidores.map(s => ({ _id: s._id, name: s.nome, codigo: s.codigo, value: parseCurrency(s.value) })),
    };
    onSubmit && onSubmit(payload);
  }

  // filtering is handled inside the dropdown components now

  return (
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
            <FL.Label>Data (evento)</FL.Label>
            <FL.FormRow>
              <DateInput
                type="date"
                value={local.date || ''}
                onKeyDown={e => { e.preventDefault(); }}
                inputMode="none"
                onClick={e => {
                  const t = e.target;
                  if (t.showPicker) try { t.showPicker(); } catch (err) { }
                }}
                onFocus={e => {
                  const t = e.target;
                  if (t.showPicker) try { t.showPicker(); } catch (err) { }
                }}
                onChange={e => setLocal(l => ({ ...l, date: e.target.value }))}

              />
              <CalendarButton type="button" onClick={() => {
                const el = document.querySelector('input[type="date"]');
                if (el && el.showPicker) try { el.showPicker(); } catch (err) { }
              }} aria-label="Abrir calendário">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 11H9V13H7zM11 11H13V13H11zM15 11H17V13H15z" fill="white" /><path d="M7 3V5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 3V5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 7H21" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 21H19C20.1046 21 21 20.1046 21 19V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V19C3 20.1046 3.89543 21 5 21Z" fill="rgba(0,0,0,0.12)" /></svg>
              </CalendarButton>
            </FL.FormRow>
            <FL.Label>Vencimento (automático)</FL.Label>
            <DueDateInput type="date" value={local.dueDate || ''} readOnly />
          </div>

          <div>
            <FL.Label>Selecionar Servidor (pode selecionar vários)</FL.Label>
            <ServidorDropdown items={servidores} onSelect={id => addServidorById(id)} />
          </div>

          {selectedServidores.length > 0 && (
            <div>
              <SelectedTitle>Profissionais selecionados</SelectedTitle>
              <SelectedList>
                {selectedServidores.map(s => (
                  <SelectedItem key={s._id}>
                    <SelectedLabel>{`${s.codigo ? s.codigo + ' - ' : ''}${s.nome}`}</SelectedLabel>
                    <ValueInput
                      placeholder="Valor R$"
                      value={s.value}
                      onChange={e => setServidorValue(s._id, e.target.value)}
                      onBlur={e => setServidorValue(s._id, formatBRL(e.target.value))}
                      onFocus={e => {
                        const raw = String(s.value || '').replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
                        setServidorValue(s._id, raw);
                        try { e.target.selectionStart = e.target.selectionEnd = e.target.value.length; } catch (err) { }
                      }}
                    />
                    <FL.DropdownButton as="button" type="button" onClick={() => removeServidor(s._id)}>Remover</FL.DropdownButton>
                  </SelectedItem>
                ))}
              </SelectedList>
            </div>
          )}

          <FL.Actions>
            <FE.SecondaryButton type="button" onClick={onClose}>Cancelar</FE.SecondaryButton>
            <FE.Button type="submit" disabled={loading}>{editing ? 'Salvar' : 'Criar'}</FE.Button>
          </FL.Actions>
        </FormGrid>
      </form>
    </Modal>
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
const SelectedItem = styled.li`
  display: flex;
  gap: var(--space-sm, 8px);
  align-items: center;
  margin-bottom: var(--space-xs, 6px);
`;
const SelectedLabel = styled.div`
  flex: 1;
`;
const ValueInput = styled.input`
  width: 120px;
`;
const FooterActions = styled.div`
  display: flex;
  gap: var(--space-sm, 8px);
  justify-content: flex-end;
`;

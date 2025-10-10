"use client";
/* eslint-env browser */
import { useEffect, useRef, useState } from "react";
import * as FL from './FormLayout';
// ensure FL is considered used by linter in module scope
void FL;

export default function ClienteDropdown({ items, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      try { inputRef.current.focus(); } catch (e) { void e; }
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

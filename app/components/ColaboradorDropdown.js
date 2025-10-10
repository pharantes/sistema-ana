"use client";
/* eslint-env browser */
import { useEffect, useRef, useState } from "react";
import * as FL from './FormLayout';
void FL;

export default function ColaboradorDropdown({ items, onSelect }) {
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

  const filtered = items.filter(s => {
    if (!search) return true;
    return String(s.nome || s.name || '').toLowerCase().includes(search.toLowerCase()) || String(s.codigo || '').includes(search);
  });

  return (
    <FL.DropdownWrapper ref={ref}>
      <FL.DropdownButton type="button" onClick={() => setOpen(v => !v)}>
        -- selecione um colaborador --
      </FL.DropdownButton>
      {open && (
        <FL.DropdownPanel role="listbox" aria-label="Colaboradores">
          <FL.DropdownInput
            ref={inputRef}
            placeholder='Buscar colaborador...'
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
            {filtered.length === 0 && <FL.EmptyMessage>Nenhum colaborador</FL.EmptyMessage>}
          </div>
        </FL.DropdownPanel>
      )}
    </FL.DropdownWrapper>
  );
}

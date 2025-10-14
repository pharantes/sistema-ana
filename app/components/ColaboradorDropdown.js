"use client";
/* eslint-env browser */
import { useEffect, useRef, useState } from "react";
import * as FL from './FormLayout';
import { Note } from './ui/primitives';

/**
 * Filters colaboradores by search query (nome, name, or codigo)
 */
function filterColaboradoresBySearch(items, searchQuery) {
  if (!searchQuery) return items;

  const lowerQuery = searchQuery.toLowerCase();
  return items.filter(colaborador => {
    const nome = String(colaborador.nome || colaborador.name || '').toLowerCase();
    const codigo = String(colaborador.codigo || '');
    return nome.includes(lowerQuery) || codigo.includes(searchQuery);
  });
}

/**
 * Formats colaborador display label
 */
function formatColaboradorLabel(colaborador) {
  const codigo = colaborador.codigo || '';
  const nome = colaborador.nome || colaborador.name || '';
  return `${codigo} ${nome}`.trim();
}

/**
 * ColaboradorDropdown - Searchable dropdown for selecting colaboradores with keyboard navigation
 */
export default function ColaboradorDropdown({ items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      try {
        inputRef.current.focus();
      } catch (error) {
        void error;
      }
    }
  }, [isOpen]);

  const filteredColaboradores = filterColaboradoresBySearch(items, searchQuery);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(index => Math.min(index + 1, filteredColaboradores.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(index => Math.max(index - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredColaboradores[highlightedIndex]) {
        onSelect(filteredColaboradores[highlightedIndex]._id);
        setIsOpen(false);
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <FL.DropdownWrapper ref={dropdownRef}>
      <FL.DropdownButton type="button" onClick={() => setIsOpen(isCurrentlyOpen => !isCurrentlyOpen)}>
        -- selecione um colaborador --
      </FL.DropdownButton>
      {isOpen && (
        <FL.DropdownPanel role="listbox" aria-label="Colaboradores">
          <FL.DropdownInput
            ref={inputRef}
            placeholder='Buscar colaborador...'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div>
            {filteredColaboradores.map((colaborador, index) => (
              <FL.OptionItem
                role="option"
                aria-selected={index === highlightedIndex}
                key={colaborador._id}
                onClick={() => {
                  onSelect(colaborador._id);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                $highlight={index === highlightedIndex}
              >
                {formatColaboradorLabel(colaborador)}
              </FL.OptionItem>
            ))}
            {filteredColaboradores.length === 0 && <Note>Nenhum colaborador</Note>}
          </div>
        </FL.DropdownPanel>
      )}
    </FL.DropdownWrapper>
  );
}

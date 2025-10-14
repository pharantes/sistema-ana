"use client";
/* eslint-env browser */
import { useEffect, useRef, useState } from "react";
import * as FL from './FormLayout';
import { Note } from './ui/primitives';

/**
 * Finds selected cliente by ID
 */
function findSelectedCliente(items, selectedValue) {
  return items.find(item => String(item._id) === String(selectedValue));
}

/**
 * Filters clientes by search query (nome or codigo)
 */
function filterClientesBySearch(items, searchQuery) {
  if (!searchQuery) return items;

  const lowerQuery = searchQuery.toLowerCase();
  return items.filter(cliente => {
    const nome = String(cliente.nome || '').toLowerCase();
    const codigo = String(cliente.codigo || '');
    return nome.includes(lowerQuery) || codigo.includes(searchQuery);
  });
}

/**
 * Formats cliente display label
 */
function formatClienteLabel(cliente) {
  if (!cliente) return '-- selecione o cliente --';
  const codigo = cliente.codigo || '';
  const nome = cliente.nome || cliente.name || '';
  return `${codigo} ${nome}`.trim();
}

/**
 * ClienteDropdown - Searchable dropdown for selecting clientes with keyboard navigation
 */
export default function ClienteDropdown({ items, value, onSelect }) {
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

  const selectedCliente = findSelectedCliente(items, value);
  const filteredClientes = filterClientesBySearch(items, searchQuery);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(index => Math.min(index + 1, filteredClientes.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(index => Math.max(index - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredClientes[highlightedIndex]) {
        onSelect(filteredClientes[highlightedIndex]._id);
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
        {formatClienteLabel(selectedCliente)}
      </FL.DropdownButton>
      {isOpen && (
        <FL.DropdownPanel role="listbox" aria-label="Clientes">
          <FL.DropdownInput
            ref={inputRef}
            placeholder='Buscar cliente...'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div>
            {filteredClientes.map((cliente, index) => (
              <FL.OptionItem
                role="option"
                aria-selected={index === highlightedIndex}
                key={cliente._id}
                onClick={() => {
                  onSelect(cliente._id);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                $highlight={index === highlightedIndex}
              >
                {formatClienteLabel(cliente)}
              </FL.OptionItem>
            ))}
            {filteredClientes.length === 0 && <Note>Nenhum cliente</Note>}
          </div>
        </FL.DropdownPanel>
      )}
    </FL.DropdownWrapper>
  );
}

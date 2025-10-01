"use client";
import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  color: black;
  padding: 20px;
  min-width: 420px;
  max-height: 90vh;
  overflow: auto;

  input, select, textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #111;
    font-size: 14px;
    box-sizing: border-box;
    margin-bottom: 6px;
  }

  input[readonly] {
    background: #f5f5f5;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #333;
  }

  button {
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid transparent;
    background: #1976d2;
    color: white;
    cursor: pointer;
  }

  button[type="button"] {
    background: #ccc;
    color: #111;
  }
`;

export default function Modal({ children, onClose, ariaLabel }) {
  return (
    <ModalOverlay role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <ModalContent role="dialog" aria-label={ariaLabel || 'Modal'}>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
}

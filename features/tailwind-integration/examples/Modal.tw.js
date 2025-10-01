"use client";
import React from 'react';

export default function ModalTW({ children, onClose, ariaLabel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="bg-white text-black rounded-lg p-5 min-w-[420px] max-h-[90vh] overflow-auto" role="dialog" aria-label={ariaLabel || 'Modal'}>
        {children}
      </div>
    </div>
  );
}

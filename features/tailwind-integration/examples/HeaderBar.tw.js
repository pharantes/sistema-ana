"use client";
import * as FE from '../../app/components/FormElements';

export default function HeaderBarTW({ username, role, onNewAction, onSignOut }) {
  return (
    <header className="w-full flex items-center justify-between py-6">
      <div className="text-base font-semibold text-[var(--color-text-primary)]">Bem-vindo, {username} ({role})</div>
      <div className="space-x-3">
        <FE.InlineButton onClick={onNewAction}>Nova Ação</FE.InlineButton>
        <button onClick={onSignOut} className="text-sm text-[var(--color-text-muted)]">Sair</button>
      </div>
    </header>
  );
}

"use client";
/* eslint-env browser */

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import styled from 'styled-components';
import { Note, RowTopGap } from '../components/ui/primitives';
import * as FE from "../components/FormElements";
import ActionListTable from "./components/ActionListTable";
import Filters from "../components/Filters";
import dynamic from 'next/dynamic';
const ActionModal = dynamic(() => import('../components/ActionModal'), { ssr: false });

const TopWrap = styled.div`
  padding: var(--page-padding);
`;
const SectionWrap = styled.div`
  margin-top: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;
const ButtonsRow = RowTopGap;
// using shared Note from primitives

export default function AcoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [acoes, setAcoes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [q, setQ] = useState("");
  const [rangeMode, setRangeMode] = useState('inicio');
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAcoesWithFilters = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setIsFetching(true);

      const params = new globalThis.URLSearchParams();
      if (q) params.set('q', q);
      if (rangeFrom || rangeTo) {
        if (rangeMode === 'inicio') {
          if (rangeFrom) params.set('startFrom', rangeFrom);
          if (rangeTo) params.set('startTo', rangeTo);
        } else if (rangeMode === 'fim') {
          if (rangeFrom) params.set('endFrom', rangeFrom);
          if (rangeTo) params.set('endTo', rangeTo);
        }
      }

      const url = '/api/action' + (params.toString() ? `?${params.toString()}` : '');
      const res = await globalThis.fetch(url);
      if (res.status === 401) {
        setAcoes([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch actions');
      const data = await res.json();
      setAcoes(data);
    } catch {
      // keep UI simple; user can retry by changing filters
    } finally {
      if (isInitial) setInitialLoading(false);
      else setIsFetching(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    const t = globalThis.setTimeout(() => fetchAcoesWithFilters(false), 300);
    return () => globalThis.clearTimeout(t);
  }, [q, rangeMode, rangeFrom, rangeTo, status, session]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    fetchAcoesWithFilters(true);
  }, [status, session]);

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (acao) => {
    setEditing(acao);
    setModalOpen(true);
  };

  const handleDelete = async (acao) => {
    if (!globalThis.confirm('Tem certeza que deseja excluir esta ação?')) return;
    try {
      const res = await globalThis.fetch(`/api/action/${acao._id}`, { method: 'DELETE' });
      if (res.ok) fetchAcoesWithFilters();
      else globalThis.alert('Falha ao excluir ação');
    } catch {
      globalThis.alert('Erro ao excluir ação');
    }
  };

  const handleModalSubmit = async (payload) => {
    try {
      if (editing) {
        const res = await globalThis.fetch('/api/action/edit', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing._id, ...payload }) });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await globalThis.fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to create');
      }
      setModalOpen(false);
      setEditing(null);
      fetchAcoesWithFilters();
    } catch {
      globalThis.alert('Erro ao salvar ação');
    }
  };

  const generatePdf = async () => {
    try {
      const params = new globalThis.URLSearchParams();
      if (q) params.set('q', q);
      if (rangeFrom || rangeTo) {
        if (rangeMode === 'inicio') {
          if (rangeFrom) params.set('startFrom', rangeFrom);
          if (rangeTo) params.set('startTo', rangeTo);
        } else if (rangeMode === 'fim') {
          if (rangeFrom) params.set('endFrom', rangeFrom);
          if (rangeTo) params.set('endTo', rangeTo);
        }
      }
      const url = '/api/action/report' + (params.toString() ? `?${params.toString()}` : '');
      const res = await globalThis.fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to generate PDF: ${res.status} ${txt}`);
      }
      const blob = await res.blob();
      const blobUrl = globalThis.URL.createObjectURL(blob);
      globalThis.window.open(blobUrl, '_blank');
    } catch {
      globalThis.alert('Falha ao gerar PDF');
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <TopWrap>
        <div>Carregando...</div>
      </TopWrap>
    );
  }

  if (!session) return null;

  return (
    <TopWrap>
      <HeaderBar username={session.user?.username || session.user?.name} role={session.user?.role} />

      <SectionWrap>
        <Filters
          q={q} setQ={setQ}
          rangeMode={rangeMode} setRangeMode={setRangeMode}
          rangeFrom={rangeFrom} setRangeFrom={setRangeFrom}
          rangeTo={rangeTo} setRangeTo={setRangeTo}
        />

        <ButtonsRow>
          <FE.TopButton onClick={handleNew}>Nova Ação</FE.TopButton>
          {session?.user?.role === 'admin' && (
            <FE.TopSecondaryButton onClick={generatePdf}>Gerar PDF</FE.TopSecondaryButton>
          )}
        </ButtonsRow>

        <SectionWrap>
          <ActionListTable actions={acoes} session={session} onEdit={handleEdit} onDelete={handleDelete} />
          {isFetching && <Note>Atualizando…</Note>}
        </SectionWrap>
      </SectionWrap>

      {modalOpen && (
        <ActionModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleModalSubmit}
        />
      )}
    </TopWrap>
  );
}
"use client";
/* eslint-env browser */

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from 'styled-components';
import { Note, RowTopGap } from '../components/ui/primitives';
import * as FE from "../components/FormElements";
import ActionListTable from "./components/ActionListTable";
import Filters from "../components/Filters";
import dynamic from 'next/dynamic';

const ActionModal = dynamic(() => import('../components/ActionModal'), { ssr: false });

// Styled Components
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;

const TopWrap = styled.div`
  padding: var(--page-padding);
`;

const SectionWrap = styled.div`
  margin-top: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;

const ButtonsRow = RowTopGap;

/**
 * Builds URL search parameters for action filtering.
 */
function buildFilterParams(searchQuery, rangeMode, rangeFrom, rangeTo) {
  const params = new globalThis.URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (rangeFrom || rangeTo) {
    if (rangeMode === 'inicio') {
      if (rangeFrom) params.set('startFrom', rangeFrom);
      if (rangeTo) params.set('startTo', rangeTo);
    } else if (rangeMode === 'fim') {
      if (rangeFrom) params.set('endFrom', rangeFrom);
      if (rangeTo) params.set('endTo', rangeTo);
    }
  }

  return params;
}

/**
 * Fetches actions from the API with current filter parameters.
 */
async function fetchActions(filterParams) {
  const url = '/api/action' + (filterParams.toString() ? `?${filterParams.toString()}` : '');
  const response = await globalThis.fetch(url);

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to fetch actions');
  }

  return await response.json();
}

/**
 * Main page component for managing actions (acoes).
 * Provides filtering, creation, editing, and deletion of actions.
 */
export default function AcoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State - Data
  const [acoes, setAcoes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // State - Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeMode, setRangeMode] = useState('inicio');
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // State - Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAcoesWithFilters = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsFetching(true);
      }

      const params = buildFilterParams(searchQuery, rangeMode, rangeFrom, rangeTo);
      const data = await fetchActions(params);
      setAcoes(data);
    } catch {
      // Keep UI simple; user can retry by changing filters
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setIsFetching(false);
      }
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
    const timeoutId = globalThis.setTimeout(() => fetchAcoesWithFilters(false), 300);
    return () => globalThis.clearTimeout(timeoutId);
  }, [searchQuery, rangeMode, rangeFrom, rangeTo, status, session]);

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
      const params = buildFilterParams(searchQuery, rangeMode, rangeFrom, rangeTo);
      const url = '/api/action/report' + (params.toString() ? `?${params.toString()}` : '');
      const response = await globalThis.fetch(url);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to generate PDF: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
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
      <Title>Ações</Title>
      <SectionWrap>
        <Filters
          q={searchQuery} setQ={setSearchQuery}
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

      {
        modalOpen && (
          <ActionModal
            editing={editing}
            onClose={() => { setModalOpen(false); setEditing(null); }}
            onSubmit={handleModalSubmit}
          />
        )
      }
    </TopWrap >
  );
}
"use client";
/* eslint-env browser */

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import * as FE from "../components/FormElements";
import ActionListTable from "./components/ActionListTable";
import Filters from "../components/Filters";
import dynamic from 'next/dynamic';
const ActionModal = dynamic(() => import('../components/ActionModal'), { ssr: false });

export default function AcoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [acoes, setAcoes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [q, setQ] = useState("");
  // unified date range filters: rangeMode = 'inicio' | 'fim'
  const [rangeMode, setRangeMode] = useState('inicio');
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // fetch actions respecting filters
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

      const response = await globalThis.fetch(url);

      // don't perform navigation here; session-based redirect is handled in the effect
      if (response.status === 401) {
        setAcoes([]);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch actions');

      const data = await response.json();
      setAcoes(data);
    } catch {
      // swallow fetch error; UI shows loading state and retry on next change
    } finally {
      if (isInitial) setInitialLoading(false);
      else setIsFetching(false);
    }
  };

  // separate session redirect from filter updates to avoid navigation while typing
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // debounce filter-triggered fetches to avoid firing on every keystroke
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return; // don't trigger fetches until session is present

    const t = globalThis.setTimeout(() => {
      fetchAcoesWithFilters(false);
    }, 300);

    return () => globalThis.clearTimeout(t);
  }, [q, rangeMode, rangeFrom, rangeTo, status, session]);

  // initial fetch once session is available
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    fetchAcoesWithFilters(true);
    // run once when session becomes available
  }, [status, session]);

  const handleNew = () => {
    // open in-page modal
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (acao) => {
    setEditing(acao);
    setModalOpen(true);
  };

  const handleDelete = async (acao) => {
    if (!globalThis.confirm("Tem certeza que deseja excluir esta ação?")) return;
    try {
      const res = await globalThis.fetch(`/api/action/${acao._id}`, { method: "DELETE" });
      if (res.ok) fetchAcoesWithFilters();
      else globalThis.alert("Falha ao excluir ação");
    } catch {
      globalThis.alert("Erro ao excluir ação");
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);


  const handleModalSubmit = async (payload) => {
    try {
      if (editing) {
        // call PATCH
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
      // align with server report API: choose based on rangeMode
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

  if (status === "loading" || initialLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{ padding: "2rem" }}>
      <HeaderBar username={session.user?.username || session.user?.name} role={session.user?.role} />

      <div style={{ marginTop: "1rem" }}>
        <Filters
          q={q} setQ={setQ}
          rangeMode={rangeMode} setRangeMode={setRangeMode}
          rangeFrom={rangeFrom} setRangeFrom={setRangeFrom}
          rangeTo={rangeTo} setRangeTo={setRangeTo}
        />

        <div style={{ marginTop: "0.5rem", display: 'flex', gap: 8 }}>
          <FE.TopButton onClick={handleNew}>Nova Ação</FE.TopButton>
          {session?.user?.role === 'admin' && (
            <FE.TopSecondaryButton onClick={generatePdf}>Gerar PDF</FE.TopSecondaryButton>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <ActionListTable actions={acoes} session={session} onEdit={handleEdit} onDelete={handleDelete} />
          {isFetching && <div style={{ marginTop: 8, color: '#666' }}>Atualizando…</div>}
        </div>
      </div>

      {modalOpen && (
        <ActionModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
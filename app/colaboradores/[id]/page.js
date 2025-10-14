"use client";
/* eslint-env browser */
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ColaboradorModal from '../../components/ColaboradorModal';
import * as FE from '../../components/FormElements';
import { Table, ThClickable, Td } from '../../components/ui/Table';
import styled from 'styled-components';
import { Note, RowWrap, ActionsInline } from '../../components/ui/primitives';
import LinkButton from '../../components/ui/LinkButton';
import Pager from '../../components/ui/Pager';
import { formatDateBR } from '@/lib/utils/dates';

export default function ColaboradorDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [colaborador, setColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [acoes, setAcoes] = useState([]);
  const [acoesSortKey, setAcoesSortKey] = useState('date');
  const [acoesSortDir, setAcoesSortDir] = useState('desc');
  const [acoesPage, setAcoesPage] = useState(1);
  const [acoesPageSize, setAcoesPageSize] = useState(10);
  const dateToTime = (v) => { if (!v) return 0; const d = new Date(v); return isNaN(d) ? 0 : d.getTime(); };
  const sortedAcoes = (() => {
    const list = Array.isArray(acoes) ? acoes.slice() : [];
    const getVal = (a) => {
      switch (acoesSortKey) {
        case 'name': return String(a?.name || a?.event || '').toLowerCase();
        case 'client': return String(a?.clientName || a?.client || '').toLowerCase();
        case 'start': return dateToTime(a?.startDate);
        case 'end': return dateToTime(a?.endDate);
        case 'date': default: return dateToTime(a?.date || a?.createdAt);
      }
    };
    list.sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return acoesSortDir === 'asc' ? va - vb : vb - va;
      const sa = String(va || ''), sb = String(vb || '');
      const cmp = sa.localeCompare(sb);
      return acoesSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  })();
  const acoesPageData = (() => {
    const start = (acoesPage - 1) * acoesPageSize;
    return sortedAcoes.slice(start, start + acoesPageSize);
  })();
  const toggleAcoesSort = (key) => { if (acoesSortKey === key) setAcoesSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setAcoesSortKey(key); setAcoesSortDir(key === 'name' || key === 'client' ? 'asc' : 'desc'); } };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await globalThis.fetch(`/api/colaborador/${id}`);
        if (!res.ok) throw new Error('Falha ao carregar colaborador');
        const data = await res.json();
        if (!cancelled) setColaborador(data);
        try {
          const sp = new URLSearchParams();
          if (data?._id) sp.set('colaboradorId', String(data._id));
          if (data?.nome) sp.set('colaboradorName', String(data.nome));
          const list = await globalThis.fetch(`/api/action?${sp.toString()}`).then(r => r.ok ? r.json() : []);
          if (!cancelled) setAcoes(Array.isArray(list) ? list : []);
        } catch { /* ignore */ }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao carregar');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const PageWrap = styled.div`
    padding: var(--space-lg, 24px);
  `;
  const Grid2 = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: var(--gap-sm, var(--space-sm, var(--space-sm, 12px)));
  `;
  const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
  `;
  const MsgWrap = styled.div`
    padding: var(--space-lg);
  `;
  // use shared ActionsInline primitive for compact action buttons
  const ActionButtons = ActionsInline;

  const H2 = styled.h2`
    margin-top: var(--space-md, var(--space-md, var(--space-md, 16px)));
    margin-bottom: var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px)));
  `;

  const ControlsRow = RowWrap;

  const ControlsInner = styled.div`
    display:flex;
    align-items:center;
    gap:var(--gap-sm, var(--space-sm, var(--space-sm, 12px)));
  `;

  // using shared Note from primitives

  if (status === 'loading' || loading) return <MsgWrap>Carregando…</MsgWrap>;
  if (!session) return <MsgWrap>Acesso restrito</MsgWrap>;
  if (error) return <MsgWrap>Erro: {error}</MsgWrap>;
  if (!colaborador) return <MsgWrap>Colaborador não encontrado</MsgWrap>;

  return (
    <PageWrap>
      <HeaderRow>
        <h1>Colaborador</h1>
        <ActionButtons>
          <FE.SecondaryButton onClick={() => router.back()}>Voltar</FE.SecondaryButton>
          <FE.Button onClick={() => setEditOpen(true)}>Editar</FE.Button>
        </ActionButtons>
      </HeaderRow>
      <Grid2>
        <div><strong>Código</strong><div>{colaborador.codigo}</div></div>
        <div><strong>Nome</strong><div>{colaborador.nome}</div></div>
        <div><strong>Empresa</strong><div>{colaborador.empresa}</div></div>
        <div><strong>PIX</strong><div>{colaborador.pix}</div></div>
        <div><strong>Banco</strong><div>{colaborador.banco} {colaborador.conta}</div></div>
        <div><strong>UF</strong><div>{colaborador.uf}</div></div>
        <div><strong>Telefone</strong><div>{colaborador.telefone}</div></div>
        <div><strong>Email</strong><div>{colaborador.email}</div></div>
        <div><strong>Tipo</strong><div>{colaborador.tipo}</div></div>
        <div><strong>CNPJ/CPF</strong><div>{colaborador.cnpjCpf}</div></div>
      </Grid2>
      <H2>Ações deste colaborador</H2>
      {Array.isArray(acoes) && acoes.length ? (
        <Table>
          <thead>
            <tr>
              <ThClickable onClick={() => toggleAcoesSort('date')}>
                Data {acoesSortKey === 'date' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleAcoesSort('name')}>
                Nome {acoesSortKey === 'name' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleAcoesSort('client')}>
                Cliente {acoesSortKey === 'client' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleAcoesSort('start')}>
                Início {acoesSortKey === 'start' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
              <ThClickable onClick={() => toggleAcoesSort('end')}>
                Fim {acoesSortKey === 'end' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </ThClickable>
            </tr>
          </thead>
          <tbody>
            {acoesPageData.map(a => (
              <tr key={a._id}>
                <Td>{formatDateBR(a.date)}</Td>
                <Td>
                  <LinkButton onClick={() => router.push(`/acoes/${a._id}`)}>
                    {a.name || a.event}
                  </LinkButton>
                </Td>
                <Td>{a.clientName || a.client}</Td>
                <Td>{formatDateBR(a.startDate)}</Td>
                <Td>{formatDateBR(a.endDate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Note>Nenhuma ação encontrada para este colaborador.</Note>
      )}
      {Array.isArray(acoes) && acoes.length > acoesPageSize && (
        <ControlsRow>
          <Pager page={acoesPage} pageSize={acoesPageSize} total={acoes.length} onChangePage={setAcoesPage} />
          <ControlsInner>
            <Note>Mostrar:</Note>
            <select value={acoesPageSize} onChange={(e) => { setAcoesPage(1); setAcoesPageSize(Number(e.target.value)); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <Note>Total: {acoes.length}</Note>
          </ControlsInner>
        </ControlsRow>
      )}
      {editOpen && (
        <ColaboradorModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={colaborador}
          onSubmit={async (updated) => {
            try {
              const res = await globalThis.fetch('/api/colaborador', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updated, _id: colaborador._id }) });
              if (!res.ok) throw new Error('Falha ao salvar');
              const fresh = await globalThis.fetch(`/api/colaborador/${id}`).then(r => r.json());
              setColaborador(fresh);
              setEditOpen(false);
            } catch (e) {
              globalThis.alert(e.message || 'Erro ao salvar');
            }
          }}
        />
      )}
    </PageWrap>
  );
}

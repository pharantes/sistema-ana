"use client";
/* eslint-env browser */
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ColaboradorModal from '../../components/ColaboradorModal';
import * as FE from '../../components/FormElements';
import { Table, Th, Td } from '../../components/ui/Table';
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

  if (status === 'loading' || loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!session) return <div style={{ padding: 24 }}>Acesso restrito</div>;
  if (error) return <div style={{ padding: 24 }}>Erro: {error}</div>;
  if (!colaborador) return <div style={{ padding: 24 }}>Colaborador não encontrado</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Colaborador</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <FE.SecondaryButton onClick={() => router.back()} style={{ height: 40 }}>Voltar</FE.SecondaryButton>
          <FE.Button onClick={() => setEditOpen(true)} style={{ height: 40 }}>Editar</FE.Button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 12 }}>
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
      </div>
      <h2 style={{ marginTop: 16, marginBottom: 6 }}>Ações deste colaborador</h2>
      {Array.isArray(acoes) && acoes.length ? (
        <Table>
          <thead>
            <tr>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAcoesSort('date')}>
                Data {acoesSortKey === 'date' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAcoesSort('name')}>
                Nome {acoesSortKey === 'name' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAcoesSort('client')}>
                Cliente {acoesSortKey === 'client' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAcoesSort('start')}>
                Início {acoesSortKey === 'start' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
              <Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAcoesSort('end')}>
                Fim {acoesSortKey === 'end' ? (acoesSortDir === 'asc' ? '▲' : '▼') : ''}
              </Th>
            </tr>
          </thead>
          <tbody>
            {acoesPageData.map(a => (
              <tr key={a._id}>
                <Td>{formatDateBR(a.date)}</Td>
                <Td>
                  <button onClick={() => router.push(`/acoes/${a._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                    {a.name || a.event}
                  </button>
                </Td>
                <Td>{a.clientName || a.client}</Td>
                <Td>{formatDateBR(a.startDate)}</Td>
                <Td>{formatDateBR(a.endDate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div style={{ color: '#6B7280', fontSize: '0.95rem' }}>Nenhuma ação encontrada para este colaborador.</div>
      )}
      {Array.isArray(acoes) && acoes.length > acoesPageSize && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Pager page={acoesPage} pageSize={acoesPageSize} total={acoes.length} onChangePage={setAcoesPage} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrar:</span>
            <select value={acoesPageSize} onChange={(e) => { setAcoesPage(1); setAcoesPageSize(Number(e.target.value)); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {acoes.length}</span>
          </div>
        </div>
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
    </div>
  );
}

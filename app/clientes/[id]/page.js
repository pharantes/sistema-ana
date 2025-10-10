"use client";
/* eslint-env browser */
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ClienteModal from '../../components/ClienteModal';
import * as FE from '../../components/FormElements';
import { Table, Th, Td } from '../../components/ui/Table';
import Pager from '../../components/ui/Pager';

// use shared Table/Th/Td for consistency

export default function ClienteDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [acoes, setAcoes] = useState([]);
  const [acoesSortKey, setAcoesSortKey] = useState('date'); // 'date' | 'name' | 'start' | 'end'
  const [acoesSortDir, setAcoesSortDir] = useState('desc'); // 'asc' | 'desc'
  const [acoesPage, setAcoesPage] = useState(1);
  const [acoesPageSize, setAcoesPageSize] = useState(10);
  const dateToTime = (v) => { if (!v) return 0; const d = new Date(v); return isNaN(d) ? 0 : d.getTime(); };
  const sortedAcoes = (() => {
    const list = Array.isArray(acoes) ? acoes.slice() : [];
    const getVal = (a) => {
      switch (acoesSortKey) {
        case 'name': return String(a?.name || a?.event || '').toLowerCase();
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
  const toggleAcoesSort = (key) => { if (acoesSortKey === key) setAcoesSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setAcoesSortKey(key); setAcoesSortDir(key === 'name' ? 'asc' : 'desc'); } };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await globalThis.fetch(`/api/cliente/${id}`);
        if (!res.ok) throw new Error('Falha ao carregar cliente');
        const data = await res.json();
        if (!cancelled) setCliente(data);
        // fetch actions for this client using server-side filter
        try {
          const list = await globalThis.fetch(`/api/action?clientId=${encodeURIComponent(String(data._id))}`).then(r => r.ok ? r.json() : []);
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
  if (!cliente) return <div style={{ padding: 24 }}>Cliente não encontrado</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Cliente</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <FE.SecondaryButton onClick={() => router.back()}>Voltar</FE.SecondaryButton>
          <FE.TopButton onClick={() => setEditOpen(true)}>Editar</FE.TopButton>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 12 }}>
        <div><strong>Código</strong><div>{cliente.codigo}</div></div>
        <div><strong>Nome</strong><div>{cliente.nome}</div></div>
        <div><strong>Endereço</strong><div>{cliente.endereco}</div></div>
        <div><strong>Cidade</strong><div>{cliente.cidade}</div></div>
        <div><strong>UF</strong><div>{cliente.uf}</div></div>
        <div><strong>Telefone</strong><div>{cliente.telefone}</div></div>
        <div><strong>Email</strong><div>{cliente.email}</div></div>
        <div><strong>Contato</strong><div>{cliente.nomeContato}</div></div>
        <div><strong>Tipo</strong><div>{cliente.tipo}</div></div>
        <div><strong>CNPJ/CPF</strong><div>{cliente.cnpjCpf}</div></div>
      </div>

      <h2 style={{ marginTop: 16, marginBottom: 6 }}>Ações deste cliente</h2>
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
                <Td>{a.date ? new Date(a.date).toLocaleDateString('pt-BR') : ''}</Td>
                <Td>
                  <button onClick={() => router.push(`/acoes/${a._id}`)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                    {a.name || a.event}
                  </button>
                </Td>
                <Td>{a.startDate ? new Date(a.startDate).toLocaleDateString('pt-BR') : ''}</Td>
                <Td>{a.endDate ? new Date(a.endDate).toLocaleDateString('pt-BR') : ''}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div style={{ color: '#6B7280', fontSize: '0.95rem' }}>Nenhuma ação encontrada para este cliente.</div>
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
        <ClienteModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={cliente}
          onSubmit={async (updated) => {
            try {
              const res = await globalThis.fetch('/api/cliente', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updated, _id: cliente._id }) });
              if (!res.ok) throw new Error('Falha ao salvar');
              const fresh = await globalThis.fetch(`/api/cliente/${id}`).then(r => r.json());
              setCliente(fresh);
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

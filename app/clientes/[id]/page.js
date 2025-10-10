"use client";
/* eslint-env browser */
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ClienteModal from '../../components/ClienteModal';
import * as FE from '../../components/FormElements';
import ClienteAcoesTable from "../components/ClienteAcoesTable";

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
  // Related actions table now handled by ClienteAcoesTable (sorting/pagination internal)

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
          <FE.SecondaryButton onClick={() => router.back()} style={{ height: 40 }}>Voltar</FE.SecondaryButton>
          <FE.Button onClick={() => setEditOpen(true)} style={{ height: 40 }}>Editar</FE.Button>
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
      <ClienteAcoesTable actions={acoes} />

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

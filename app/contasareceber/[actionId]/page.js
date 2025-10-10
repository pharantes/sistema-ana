"use client";
/* eslint-env browser */
import { useEffect, useState, use as useUnwrap } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import ContasReceberModal from '../ContasReceberModal';
import { formatDateBR, formatDateTimeBR } from '@/lib/utils/dates';
import { formatBRL } from '../../utils/currency';
import * as FE from '../../components/FormElements';

const Wrapper = styled.div`
  padding: 24px;
`;
const Title = styled.h1`
  font-size: 1.6rem;
  margin-bottom: 12px;
`;
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 12px 24px;
`;
const Label = styled.div` font-weight: 600; `;
const Value = styled.div` color: #222; `;

export default function RecebivelDetailPage({ params }) {
  const { actionId } = useUnwrap(params);
  const router = useRouter();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const url = new URL('/api/contasareceber', globalThis.location.origin);
        url.searchParams.set('actionId', actionId);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Falha ao carregar recebível');
        const data = await res.json();
        const arr = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        const item = arr.find(r => String(r._id) === String(actionId)) || arr[0] || null;
        if (!cancelled) setRow(item || null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao carregar');
      }
      if (!cancelled) setLoading(false);
    }
    if (actionId) load();
    return () => { cancelled = true; };
  }, [actionId]);

  if (loading) return <Wrapper>Carregando…</Wrapper>;
  if (error) return <Wrapper>Erro: {error}</Wrapper>;
  if (!row) return <Wrapper>Nada encontrado.</Wrapper>;

  const r = row.receivable || {};
  const data = formatDateBR(row?.date);
  const venc = formatDateBR(r?.dataVencimento);
  const receb = formatDateBR(r?.dataRecebimento);
  const docDate = formatDateBR(r?.reportDate);
  const criado = formatDateTimeBR(r?.createdAt);
  const atualizado = formatDateTimeBR(r?.updatedAt);

  return (
    <Wrapper>
      <HeaderRow>
        <Title>Recebível</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <FE.SecondaryButton onClick={() => router.push('/contasareceber')} style={{ height: 40 }}>Voltar</FE.SecondaryButton>
          <FE.Button onClick={() => setModalOpen(true)} style={{ height: 40 }}>Editar</FE.Button>
        </div>
      </HeaderRow>
      <Grid>
        <div><Label>ID</Label><Value>{row?._id || ''}</Value></div>
        <div><Label>Data do documento</Label><Value>{docDate}</Value></div>
        <div><Label>Data</Label><Value>{data}</Value></div>
        <div><Label>Status</Label><Value>{r?.status || 'ABERTO'}</Value></div>
        <div><Label>Ação</Label><Value>{row?.name || ''}</Value></div>
        <div><Label>Cliente</Label><Value>{row?.clientName || ''}</Value></div>
        <div><Label>Valor</Label><Value>{r?.valor != null ? `R$ ${formatBRL(Number(r.valor))}` : ''}</Value></div>
        <div><Label>Descrição</Label><Value>{r?.descricao || ''}</Value></div>
        <div><Label>Qtde Parcela</Label><Value>{r?.qtdeParcela ?? ''}</Value></div>
        <div><Label>Valor Parcela</Label><Value>{r?.valorParcela != null ? `R$ ${formatBRL(Number(r.valorParcela))}` : ''}</Value></div>
        <div><Label>Data Vencimento</Label><Value>{venc}</Value></div>
        <div><Label>Data Recebimento</Label><Value>{receb}</Value></div>
        <div><Label>Banco (Recebido pelo banco)</Label><Value>{r?.banco || ''}</Value></div>
        <div><Label>Conta (Cliente no registro)</Label><Value>{r?.conta || ''}</Value></div>
        <div><Label>Forma Pgt (Cliente no registro)</Label><Value>{r?.formaPgt || ''}</Value></div>
        <div><Label>Criado em</Label><Value>{criado}</Value></div>
        <div><Label>Atualizado em</Label><Value>{atualizado}</Value></div>
      </Grid>
      <div style={{ marginTop: 16 }}>
        <h3>Dados do Cliente (atual)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: '12px 24px' }}>
          <div><Label>PIX</Label><Value>{row?.clienteDetails?.pix || ''}</Value></div>
          <div><Label>Banco</Label><Value>{row?.clienteDetails?.banco || ''}</Value></div>
          <div><Label>Conta</Label><Value>{row?.clienteDetails?.conta || ''}</Value></div>
          <div><Label>Forma Pgt</Label><Value>{row?.clienteDetails?.formaPgt || ''}</Value></div>
        </div>
      </div>
      <ContasReceberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        action={row}
        receivable={row?.receivable || null}
        clienteDetails={row?.clienteDetails || null}
        onSaved={async () => {
          setModalOpen(false);
          // reload
          const url = new URL('/api/contasareceber', globalThis.location.origin);
          url.searchParams.set('actionId', actionId);
          const res = await fetch(url.toString());
          if (res.ok) {
            const data = await res.json();
            const arr = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
            const item = arr.find(r => String(r._id) === String(actionId)) || arr[0] || null;
            setRow(item || null);
          }
        }}
      />
    </Wrapper>
  );
}

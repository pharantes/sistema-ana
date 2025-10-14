"use client";
import styled from "styled-components";
import { RowBottomGap } from '../components/ui/primitives';
import { useEffect, useMemo, useState } from "react";
import FiltersClient from "./FiltersClient";
import { useSearchParams, useRouter } from "next/navigation";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import Skeleton from "../components/ui/Skeleton";
import Legend from "../components/ui/Legend";
import ErrorBanner from "../components/ui/ErrorBanner";

const Wrapper = styled.div`
  padding: var(--space-sm);
  display: grid;
  gap: var(--gap-xs);
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--gap-xs);
  /* span helpers: apply grid-column span via className e.g. .span-4 */
  & > .span-1 { grid-column: span 1; }
  & > .span-2 { grid-column: span 2; }
  & > .span-3 { grid-column: span 3; }
  & > .span-4 { grid-column: span 4; }
  & > .span-5 { grid-column: span 5; }
  & > .span-6 { grid-column: span 6; }
  & > .span-7 { grid-column: span 7; }
  & > .span-8 { grid-column: span 8; }
  & > .span-9 { grid-column: span 9; }
  & > .span-10 { grid-column: span 10; }
  & > .span-11 { grid-column: span 11; }
  & > .span-12 { grid-column: span 12; }
`;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  height: auto;
  /* allow $height prop to control height in px (prefixed prop won't be forwarded to DOM) */
  ${(p) => p.$height ? `height: ${p.$height}px;` : ''}
`;
const KPI = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
`;
const KPILabel = styled.div`
  font-size: 0.74rem;
  text-align: center;
  color: #6b7280;
`;
const KPIValue = styled.div`
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
  padding: var(--space-xs) 0;
`;

const CardTitle = styled.div`
  font-weight: 600;
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;

const ChartBox = styled.div`
  height: ${(p) => (p.$height ? `${p.$height}px` : 'var(--chart-height, 260px)')};
`;

const ChartPlaceholder = styled.div`
  padding: var(--space-xs);
  color: #6b7280;
`;

// LegendRow replaced by shared RowBottomGap primitive

// using shared Skeleton component (app/components/ui/Skeleton.js)

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acoes, setAcoes] = useState([]);
  const [pagar, setPagar] = useState([]);
  const [receber, setReceber] = useState({ items: [], total: 0 });
  const [clientes, setClientes] = useState([]);
  const [colabs, setColabs] = useState([]);
  // UI filters
  const [filterClient, setFilterClient] = useState(""); // client ID
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const searchParams = useSearchParams?.() ?? null;
  const router = useRouter?.() ?? null;

  // handlers to avoid naming collisions in JSX props
  const handleSetFilterClient = (id) => {
    setFilterClient(id);
    try {
      const qp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      if (id) qp.set('client', id); else qp.delete('client');
      if (router && router.push) router.push(`${globalThis.location.pathname}?${qp.toString()}`);
    } catch { /* ignore */ }
    try { if (globalThis?.localStorage) globalThis.localStorage.setItem('dashboard_filters', JSON.stringify({ client: id, from: filterFrom, to: filterTo })); } catch { /* ignore */ }
  };
  const handleSetFilterFrom = (v) => { setFilterFrom(v); try { if (globalThis?.localStorage) globalThis.localStorage.setItem('dashboard_filters', JSON.stringify({ client: filterClient, from: v, to: filterTo })); } catch { /* ignore */ } };
  const handleSetFilterTo = (v) => { setFilterTo(v); try { if (globalThis?.localStorage) globalThis.localStorage.setItem('dashboard_filters', JSON.stringify({ client: filterClient, from: filterFrom, to: v })); } catch { /* ignore */ } };

  // apply filters but avoid pushing on every single input change; use router.replace for minimal history noise
  const applyFilters = () => {
    try {
      const qp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      if (filterClient) qp.set('client', filterClient); else qp.delete('client');
      if (filterFrom) qp.set('from', filterFrom); else qp.delete('from');
      if (filterTo) qp.set('to', filterTo); else qp.delete('to');
      if (router && router.replace) router.replace(`${globalThis.location.pathname}?${qp.toString()}`);
    } catch { /* ignore */ }
    try { if (globalThis?.localStorage) globalThis.localStorage.setItem('dashboard_filters', JSON.stringify({ client: filterClient, from: filterFrom, to: filterTo })); } catch { /* ignore */ }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      // restore filters from query params or localStorage
      try {
        const qpClient = searchParams?.get?.('client');
        const qpFrom = searchParams?.get?.('from');
        const qpTo = searchParams?.get?.('to');
        if (qpClient) setFilterClient(qpClient);
        else if (globalThis?.localStorage) {
          const ls = globalThis.localStorage.getItem('dashboard_filters');
          if (ls) {
            try { const parsed = JSON.parse(ls); if (parsed.client) setFilterClient(parsed.client); } catch { /* ignore */ }
          }
        }
        if (qpFrom) setFilterFrom(qpFrom);
        if (qpTo) setFilterTo(qpTo);
      } catch { /* ignore */ }
      try {
        const [a, p, r, c, k] = await Promise.allSettled([
          fetchJson("/api/action"),
          fetchJson("/api/contasapagar"),
          fetchJson("/api/contasareceber"),
          fetchJson("/api/cliente"),
          fetchJson("/api/colaborador"),
        ]);
        if (!mounted) return;
        setAcoes(Array.isArray(a.value) ? a.value : []);
        setPagar(Array.isArray(p.value) ? p.value : []);
        setReceber(r.value && typeof r.value === "object" ? r.value : { items: [], total: 0 });
        setClientes(Array.isArray(c.value) ? c.value : []);
        setColabs(Array.isArray(k.value) ? k.value : []);
      } catch {
        if (mounted) setError("Erro ao carregar dados do dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const kpis = useMemo(() => {
    const inRange = (d) => {
      if (!d) return true;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return true;
      if (filterFrom) {
        const from = new Date(filterFrom);
        if (dt < from) return false;
      }
      if (filterTo) {
        const to = new Date(filterTo);
        // include end day
        to.setHours(23, 59, 59, 999);
        if (dt > to) return false;
      }
      return true;
    };
    // match by client id (filterClient stores id). fallback by name only when id missing
    const matchClient = (id, name) => {
      if (!filterClient) return true;
      if (id && String(id) === String(filterClient)) return true;
      if (name && String(name).toLowerCase() === String(filterClient).toLowerCase()) return true;
      return false;
    };

    const totalAcoes = acoes.length;
    const totalClientes = clientes.length;
    const totalColabs = colabs.length;
    let receitaPrevista = 0;
    let receitaRecebida = 0;
    (receber.items || []).forEach((r) => {
      const clientId = r?.clientId || r?.receivable?.clientId || r?.cliente?._id || "";
      const clientName = r?.clientName || r?.cliente?.name || "";
      const date = r?.receivable?.dataRecebimento || r?.receivable?.dataVencimento || r?.date || r?.reportDate;
      if (!matchClient(clientId, clientName) || !inRange(date)) return;
      const val = Number(r?.valor ?? r?.receivable?.valor ?? 0) || 0;
      receitaPrevista += val;
      const status = String(r?.receivable?.status ?? "").toUpperCase();
      if (status === "RECEBIDO") receitaRecebida += val;
    });
    let custosPrevistos = 0;
    let custosPagos = 0;
    (pagar || []).forEach((row) => {
      const clientId = row?.actionId?.client || row?.actionId?.clientId || '';
      const clientName = row?.actionId?.clientName || row?.actionId?.client?.name || row?.clientName || "";
      const date = row?.actionId?.date || row?.reportDate;
      if (!matchClient(clientId, clientName) || !inRange(date)) return;
      const staff = Array.isArray(row?.actionId?.staff) ? row.actionId.staff : [];
      const costs = Array.isArray(row?.actionId?.costs) ? row.actionId.costs : [];
      const st = row?.staffName ? staff.find((s) => s.name === row.staffName) : null;
      const ct = !row?.staffName && row?.costId ? costs.find((c) => String(c._id) === String(row.costId)) : null;
      const val = Number((st?.value ?? ct?.value) || 0);
      custosPrevistos += val;
      if (String(row?.status || "ABERTO").toUpperCase() === "PAGO") custosPagos += val;
    });
    const lucroPrev = receitaPrevista - custosPrevistos;
    const lucroReal = receitaRecebida - custosPagos;
    return {
      totalAcoes,
      totalClientes,
      totalColabs,
      receitaPrevista,
      receitaRecebida,
      custosPrevistos,
      custosPagos,
      lucroPrev,
      lucroReal,
    };
  }, [acoes, clientes, colabs, pagar, receber, filterClient, filterFrom, filterTo]);

  const monthlySeries = useMemo(() => {
    const map = new Map();
    const toKey = (d) => {
      const dt = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    };
    (receber.items || []).forEach((r) => {
      const date = r?.receivable?.dataRecebimento || r?.receivable?.dataVencimento || r?.date || r?.reportDate;
      const key = toKey(date);
      if (!key) return;
      const val = Number(r?.valor ?? r?.receivable?.valor ?? 0) || 0;
      const acc = map.get(key) || { r: 0, c: 0 };
      acc.r += val;
      map.set(key, acc);
    });
    (pagar || []).forEach((row) => {
      const date = row?.actionId?.date || row?.reportDate;
      const key = toKey(date);
      if (!key) return;
      const staff = Array.isArray(row?.actionId?.staff) ? row.actionId.staff : [];
      const costs = Array.isArray(row?.actionId?.costs) ? row.actionId.costs : [];
      const st = row?.staffName ? staff.find((s) => s.name === row.staffName) : null;
      const ct = !row?.staffName && row?.costId ? costs.find((c) => String(c._id) === String(row.costId)) : null;
      const val = Number((st?.value ?? ct?.value) || 0);
      const acc = map.get(key) || { r: 0, c: 0 };
      acc.c += val;
      map.set(key, acc);
    });
    const keys = Array.from(map.keys()).sort();
    const trimmed = keys.slice(-12);
    const receita = { id: "Receita", color: "#16a34a", data: trimmed.map((k) => ({ x: k, y: map.get(k)?.r || 0 })) };
    const custos = { id: "Custos", color: "#ef4444", data: trimmed.map((k) => ({ x: k, y: map.get(k)?.c || 0 })) };
    return [receita, custos];
  }, [receber, pagar]);

  const topClientes = useMemo(() => {
    const acc = new Map();
    (receber.items || []).forEach((r) => {
      const name = r?.clientName || r?.cliente?.name || "Cliente";
      const val = Number(r?.valor ?? r?.receivable?.valor ?? 0) || 0;
      acc.set(name, (acc.get(name) || 0) + val);
    });
    const entries = Array.from(acc.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([name, v]) => ({ cliente: name, valor: v }));
  }, [receber]);

  const marginsByClient = useMemo(() => {
    const rev = new Map();
    const cost = new Map();
    const inRange = (d) => {
      if (!d) return true;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return true;
      if (filterFrom) {
        const from = new Date(filterFrom);
        if (dt < from) return false;
      }
      if (filterTo) {
        const to = new Date(filterTo);
        to.setHours(23, 59, 59, 999);
        if (dt > to) return false;
      }
      return true;
    };
    const matchClient = (name) => {
      if (!filterClient) return true;
      if (!name) return false;
      return String(name).toLowerCase() === String(filterClient).toLowerCase();
    };

    (receber.items || []).forEach((r) => {
      const name = r?.clientName || r?.cliente?.name || "Cliente";
      const date = r?.receivable?.dataRecebimento || r?.receivable?.dataVencimento || r?.date || r?.reportDate;
      if (!matchClient(name) || !inRange(date)) return;
      const val = Number(r?.valor ?? r?.receivable?.valor ?? 0) || 0;
      rev.set(name, (rev.get(name) || 0) + val);
    });
    (pagar || []).forEach((row) => {
      const name = row?.actionId?.clientName || row?.actionId?.client?.name || row?.clientName || "Cliente";
      const date = row?.actionId?.date || row?.reportDate;
      if (!matchClient(name) || !inRange(date)) return;
      const staff = Array.isArray(row?.actionId?.staff) ? row.actionId.staff : [];
      const costs = Array.isArray(row?.actionId?.costs) ? row.actionId.costs : [];
      const st = row?.staffName ? staff.find((s) => s.name === row.staffName) : null;
      const ct = !row?.staffName && row?.costId ? costs.find((c) => String(c._id) === String(row.costId)) : null;
      const val = Number((st?.value ?? ct?.value) || 0);
      cost.set(name, (cost.get(name) || 0) + val);
    });
    const all = Array.from(new Set([...rev.keys(), ...cost.keys()]));
    return all
      .map((name) => {
        const r = rev.get(name) || 0;
        const c = cost.get(name) || 0;
        return { cliente: name, margin: r - c, receita: r, custos: c };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 8);
  }, [receber, pagar, filterClient, filterFrom, filterTo]);

  const statusDistrib = useMemo(() => {
    const pagarCounts = { ABERTO: 0, PAGO: 0 };
    (pagar || []).forEach((r) => {
      pagarCounts[String(r?.status || "ABERTO").toUpperCase()]++;
    });
    const recCounts = { ABERTO: 0, RECEBIDO: 0 };
    (receber.items || []).forEach((r) => {
      recCounts[String(r?.receivable?.status || "ABERTO").toUpperCase()]++;
    });
    return {
      pagar: [
        { id: "ABERTO", label: "ABERTO", value: pagarCounts.ABERTO },
        { id: "PAGO", label: "PAGO", value: pagarCounts.PAGO },
      ],
      receber: [
        { id: "ABERTO", label: "ABERTO", value: recCounts.ABERTO },
        { id: "RECEBIDO", label: "RECEBIDO", value: recCounts.RECEBIDO },
      ],
    };
  }, [pagar, receber]);

  // show placeholders inline while loading, and an inline error banner if any
  const showPlaceholder = loading;

  return (
    <Wrapper>
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {/* Filters (client id based) */}
      <FiltersClient
        clients={clientes}
        filterClient={filterClient}
        setFilterClient={handleSetFilterClient}
        filterFrom={filterFrom}
        setFilterFrom={handleSetFilterFrom}
        filterTo={filterTo}
        setFilterTo={handleSetFilterTo}
        onApply={applyFilters}
      />

      <Grid>
        <KPI as="div" className="span-1">
          <KPILabel>Clientes</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalClientes}</KPIValue>
        </KPI>
        <KPI as="div" className="span-1">
          <KPILabel>Colaboradores</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalColabs}</KPIValue>
        </KPI>
        <KPI as="div" className="span-1">
          <KPILabel>Ações</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalAcoes}</KPIValue>
        </KPI>
        <KPI as="div" className="span-3">
          <KPILabel>Lucro previsto</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.lucroPrev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>

        <KPI as="div" className="span-2">
          <KPILabel>Lucro real</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <KPI as="div" className="span-2">
          <KPILabel>Receita (recebida)</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.receitaRecebida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <KPI as="div" className="span-2">
          <KPILabel>Custos (pagos)</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.custosPagos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <Card className="span-7" $height={320}>
          <CardTitle>Receita x Custos (12 meses)</CardTitle>
          <ChartBox $height={260}>
            {showPlaceholder ? (
              <ChartPlaceholder>Carregando gráfico…</ChartPlaceholder>
            ) : (
              <ResponsiveLine
                data={monthlySeries}
                margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", stacked: false, min: 0 }}
                axisBottom={{ tickRotation: -35 }}
                colors={(d) => d.color}
                pointSize={6}
                useMesh
              />
            )}
          </ChartBox>
        </Card>
        <Card className="span-5" $height={320}>
          <CardTitle>Top clientes (valor previsto)</CardTitle>
          <ChartBox $height={260}>
            <ResponsiveBar
              data={topClientes}
              keys={["valor"]}
              indexBy="cliente"
              margin={{ top: 10, right: 10, bottom: 80, left: 60 }}
              axisBottom={{ tickRotation: -35 }}
              padding={0.3}
              colors={["#0ea5e9"]}
              enableLabel={false}
            />
          </ChartBox>
        </Card>

        <Card className="span-4" $height={320}>
          <CardTitle>Margens por cliente (top 8)</CardTitle>
          <RowBottomGap>
            <Legend items={[{ label: 'Receita', color: '#16a34a' }, { label: 'Custos', color: '#ef4444' }]} />
          </RowBottomGap>
          <ChartBox $height={260}>
            {showPlaceholder ? (
              <ChartPlaceholder><Skeleton width="100%" height={160} /></ChartPlaceholder>
            ) : marginsByClient.length === 0 ? (
              <ChartPlaceholder>Nenhum dado</ChartPlaceholder>
            ) : (
              <ResponsiveBar
                data={marginsByClient.map((m) => ({ cliente: m.cliente, receita: m.receita, custos: m.custos }))}
                keys={["receita", "custos"]}
                indexBy="cliente"
                margin={{ top: 10, right: 10, bottom: 80, left: 80 }}
                axisBottom={{ tickRotation: -35 }}
                padding={0.3}
                colors={{ scheme: 'nivo' }}
                groupMode="stacked"
                enableLabel={false}
              />
            )}
          </ChartBox>
        </Card>

        <Card className="span-4" $height={320}>
          <CardTitle>Contas a pagar (status)</CardTitle>
          <ChartBox $height={260}>
            <ResponsivePie
              data={statusDistrib.pagar}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.5}
              padAngle={1}
              colors={["#f59e0b", "#10b981"]}
              enableArcLabels={false}
            />
          </ChartBox>
        </Card>
        <Card className="span-4" $height={320}>
          <CardTitle>Contas a receber (status)</CardTitle>
          <ChartBox $height={260}>
            <ResponsivePie
              data={statusDistrib.receber}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.5}
              padAngle={1}
              colors={["#f59e0b", "#22c55e"]}
              enableArcLabels={false}
            />
          </ChartBox>
        </Card>
      </Grid>
    </Wrapper>
  );
}

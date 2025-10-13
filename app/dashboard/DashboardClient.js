"use client";
import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

const Wrapper = styled.div`
  padding: 16px;
  display: grid;
  gap: 16px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
`;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
`;
const KPI = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const KPILabel = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
`;
const KPIValue = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
`;

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
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
    const totalAcoes = acoes.length;
    const totalClientes = clientes.length;
    const totalColabs = colabs.length;
    let receitaPrevista = 0;
    let receitaRecebida = 0;
    (receber.items || []).forEach((r) => {
      const val = Number(r?.valor ?? r?.receivable?.valor ?? 0) || 0;
      receitaPrevista += val;
      const status = String(r?.receivable?.status ?? "").toUpperCase();
      if (status === "RECEBIDO") receitaRecebida += val;
    });
    let custosPrevistos = 0;
    let custosPagos = 0;
    (pagar || []).forEach((row) => {
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
  }, [acoes, clientes, colabs, pagar, receber]);

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

  if (loading) return <div style={{ padding: 16 }}>Carregando dashboard…</div>;
  if (error) return <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>;

  return (
    <Wrapper>
      <h1>Dashboard</h1>
      <Grid>
        <KPI style={{ gridColumn: "span 3" }}>
          <KPILabel>Clientes</KPILabel>
          <KPIValue>{kpis.totalClientes}</KPIValue>
        </KPI>
        <KPI style={{ gridColumn: "span 3" }}>
          <KPILabel>Colaboradores</KPILabel>
          <KPIValue>{kpis.totalColabs}</KPIValue>
        </KPI>
        <KPI style={{ gridColumn: "span 3" }}>
          <KPILabel>Ações</KPILabel>
          <KPIValue>{kpis.totalAcoes}</KPIValue>
        </KPI>
        <KPI style={{ gridColumn: "span 3" }}>
          <KPILabel>Lucro previsto</KPILabel>
          <KPIValue>
            R$ {kpis.lucroPrev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </KPIValue>
        </KPI>

        <Card style={{ gridColumn: "span 8", height: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Receita x Custos (12 meses)</div>
          <div style={{ height: 260 }}>
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
          </div>
        </Card>
        <Card style={{ gridColumn: "span 4", height: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Top clientes (valor previsto)</div>
          <div style={{ height: 260 }}>
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
          </div>
        </Card>

        <Card style={{ gridColumn: "span 6", height: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Contas a pagar (status)</div>
          <div style={{ height: 260 }}>
            <ResponsivePie
              data={statusDistrib.pagar}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.5}
              padAngle={1}
              colors={["#f59e0b", "#10b981"]}
              enableArcLabels={false}
            />
          </div>
        </Card>
        <Card style={{ gridColumn: "span 6", height: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Contas a receber (status)</div>
          <div style={{ height: 260 }}>
            <ResponsivePie
              data={statusDistrib.receber}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.5}
              padAngle={1}
              colors={["#f59e0b", "#22c55e"]}
              enableArcLabels={false}
            />
          </div>
        </Card>
      </Grid>
    </Wrapper>
  );
}

/* eslint-env node */
// Domain helpers for Contas a Pagar API: enrichment and query building
import Cliente from "../db/models/Cliente.js";
import Colaborador from "../db/models/Colaborador.js";

// Attach colaboradorLabel for rows with colaboradorId
export async function attachColaboradorLabel(rows) {
  try {
    const colaboradorIds = Array.from(
      new Set(
        rows
          .map((c) => (c?.colaboradorId ? String(c.colaboradorId) : ""))
          .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      )
    );
    if (!colaboradorIds.length) return rows;
    const servs = await Colaborador.find({ _id: { $in: colaboradorIds } })
      .select("_id nome empresa codigo")
      .lean();
    const map = new Map(
      servs.map((s) => [
        String(s._id),
        `${s.nome || ""}${s.empresa ? ` (${s.empresa})` : ""}`.trim(),
      ])
    );
    for (const r of rows) {
      const sid = String(r?.colaboradorId || "");
      if (map.has(sid)) r.colaboradorLabel = map.get(sid);
    }
  } catch {
    void 0; /* ignore colaborador attach errors */
  }
  return rows;
}

// Link staffName rows to Colaborador by nome when colaboradorId is missing; attach colaboradorId and colaboradorLabel
export async function linkStaffNameToColaborador(rows) {
  try {
    const staffNames = Array.from(
      new Set(
        rows.map((c) => (c?.staffName ? String(c.staffName).trim() : "")).filter(Boolean)
      )
    );
    if (!staffNames.length) return rows;
    const servsByName = await Colaborador.find({ nome: { $in: staffNames } })
      .select("_id nome empresa")
      .lean();
    const byName = new Map(
      servsByName.map((s) => [
        String(s.nome),
        {
          id: String(s._id),
          label: `${s.nome || ""}${s.empresa ? ` (${s.empresa})` : ""}`.trim(),
        },
      ])
    );
    for (const r of rows) {
      if (r.staffName && !r.colaboradorId) {
        const m = byName.get(String(r.staffName));
        if (m) {
          r.colaboradorId = m.id;
          r.colaboradorLabel = m.label;
        }
      }
    }
  } catch {
    void 0; /* ignore linking errors */
  }
  return rows;
}

// Attach clientName for rows with populated actionId objects that have client references
export async function attachClientNameFromActions(rows) {
  try {
    const clientIds = Array.from(
      new Set(
        rows
          .map((c) => String(c?.actionId?.client || ""))
          .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      )
    );
    if (!clientIds.length) return rows;
    const clientes = await Cliente.find({ _id: { $in: clientIds } })
      .select("_id nome codigo")
      .lean();
    const map = new Map(
      clientes.map((c) => [
        String(c._id),
        `${c.codigo ? c.codigo + " " : ""}${c.nome || ""}`.trim(),
      ])
    );
    for (const r of rows) {
      const cid = String(r?.actionId?.client || "");
      if (map.has(cid)) {
        if (r.actionId && typeof r.actionId === "object") {
          r.actionId.clientName = map.get(cid);
        }
      }
    }
  } catch {
    void 0; /* ignore client name resolution errors */
  }
  return rows;
}

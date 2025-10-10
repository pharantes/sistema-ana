/* eslint-env node */
// Domain-specific helpers for Action routes: query building, enrichment, and normalization
import Cliente from "../db/models/Cliente.js";

// Normalize staff array from mixed input formats
export function normalizeStaffArray(staff) {
  if (!Array.isArray(staff)) return undefined;
  const normalized = staff
    .map((s) => {
      if (typeof s === "string") {
        const parts = s.split("-");
        const name = (parts[0] || "").trim();
        const valueTxt = (parts[1] || "")
          .replace(/[^0-9.,-]/g, "")
          .replace(/\.(?=\d{3}(\D|$))/g, "")
          .replace(",", ".");
        const value = parseFloat(valueTxt) || 0;
        return { name, value };
      }
      const name = (s.name || "").trim();
      const value = Number(s.value) || 0;
      const pix = (s.pix || "").trim();
      const bank = (s.bank || "").trim();
      const pgt = (s.pgt || "").trim();
      // Staff-specific due date is stored in field 'vencimento' on schema
      const vencimento = s.vencimento ? new Date(s.vencimento) : undefined;
      return { name, value, pix, bank, pgt, vencimento };
    })
    .filter((s) => s.name && Number.isFinite(s.value));
  return normalized;
}

// Normalize costs array
export function normalizeCostsArray(costs) {
  if (!Array.isArray(costs)) return undefined;
  return costs
    .map((c) => ({
      description: String(c.description || "").trim(),
      value: Number(c.value) || 0,
      pix: (c.pix || "").trim(),
      bank: (c.bank || "").trim(),
      pgt: (c.pgt || "").trim(),
      // Cost-specific due date is also 'vencimento' on schema
      vencimento: c.vencimento ? new Date(c.vencimento) : undefined,
      colaboradorId: c.colaboradorId || undefined,
      vendorName: (c.vendorName || "").trim(),
      vendorEmpresa: (c.vendorEmpresa || "").trim(),
      _id: c._id,
    }))
    .filter((c) => c.description && Number.isFinite(c.value));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Parse a loose date input, supporting dd/mm/yyyy or yyyy/mm/dd (and with '-')
function parseLooseDate(txt) {
  if (!txt) return null;
  const s = String(txt).trim();
  const norm = s.replace(/-/g, "/");
  const parts = norm.split("/");
  let d = null;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const yyyy = Number(parts[0]);
      const mm = Number(parts[1]);
      const dd = Number(parts[2]);
      d = new Date(yyyy, mm - 1, dd);
    } else if (parts[0].length === 2) {
      const dd = Number(parts[0]);
      const mm = Number(parts[1]);
      const yyyy = Number(parts[2]);
      d = new Date(yyyy, mm - 1, dd);
    }
  }
  if (d && !isNaN(d)) return d;
  return null;
}

// Build a Mongo query based on request.searchParams for actions
// Returns: { query, q }
export async function buildActionsQuery(searchParams) {
  const q = (searchParams.get("q") || "").trim();
  const clientId = (searchParams.get("clientId") || "").trim();
  // Colaborador filters
  const colaboradorId = (searchParams.get("colaboradorId") || "").trim();
  const colaboradorName = (searchParams.get("colaboradorName") || "").trim();
  const startFrom = (searchParams.get("startFrom") || "").trim();
  const startTo = (searchParams.get("startTo") || "").trim();
  const endFrom = (searchParams.get("endFrom") || "").trim();
  const endTo = (searchParams.get("endTo") || "").trim();
  const vencFrom = (searchParams.get("vencFrom") || "").trim();
  const vencTo = (searchParams.get("vencTo") || "").trim();
  // Prefer dueFrom/dueTo naming if provided; keep venc* for backward compatibility
  const dueFrom = (searchParams.get("dueFrom") || "").trim() || vencFrom;
  const dueTo = (searchParams.get("dueTo") || "").trim() || vencTo;

  const query = {};

  // Direct filters
  if (/^[0-9a-fA-F]{24}$/.test(clientId)) {
    query.client = clientId;
  }

  if (q) {
    const safe = escapeRegex(q);
    const orConds = [
      { name: { $regex: safe, $options: "i" } },
      { event: { $regex: safe, $options: "i" } },
      { paymentMethod: { $regex: safe, $options: "i" } },
      { createdBy: { $regex: safe, $options: "i" } },
      { "staff.name": { $regex: safe, $options: "i" } },
      { "staff.pix": { $regex: safe, $options: "i" } },
      { "staff.bank": { $regex: safe, $options: "i" } },
    ];

    // match clients by nome/codigo and include their IDs
    try {
      const matchingClients = await Cliente.find({
        $or: [
          { nome: { $regex: safe, $options: "i" } },
          { codigo: { $regex: safe, $options: "i" } },
        ],
      })
        .select("_id")
        .lean()
        .exec();
      if (matchingClients.length) {
        const clientIds = matchingClients.map((c) => String(c._id));
        orConds.push({ client: { $in: clientIds } });
      }
    } catch {
      void 0; /* ignore client lookup errors */
    }

    // date-like q: match same day across fields
    const dateMatch = parseLooseDate(q);
    if (dateMatch) {
      const nextDay = new Date(dateMatch);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayRange = (field) => ({ [field]: { $gte: dateMatch, $lt: nextDay } });
      orConds.push(
        dayRange("date"),
        dayRange("startDate"),
        dayRange("endDate"),
        dayRange("dueDate"),
        dayRange("createdAt")
      );
    }

    if (orConds.length) query.$or = orConds;
  }

  // Colaborador filters: combine colaboradorId and colaboradorName using OR so we match
  // either explicit costs.colaboradorId or staff/vendor name occurrences.
  if (colaboradorId || colaboradorName) {
    const servOr = [];
    if (/^[0-9a-fA-F]{24}$/.test(colaboradorId)) {
      servOr.push({ "costs.colaboradorId": colaboradorId });
    }
    if (colaboradorName) {
      const safeServ = escapeRegex(colaboradorName);
      servOr.push(
        { "staff.name": { $regex: safeServ, $options: "i" } },
        { "costs.vendorName": { $regex: safeServ, $options: "i" } }
      );
    }
    if (servOr.length) {
      if (Array.isArray(query.$or)) query.$or = query.$or.concat(servOr);
      else query.$or = servOr;
    }
  }

  // Date ranges: startDate, endDate, and dueDate (vencimento) with inclusive end
  if (startFrom) {
    const d = new Date(startFrom);
    if (!isNaN(d)) {
      query.startDate = query.startDate || {};
      query.startDate.$gte = d;
    }
  }
  if (startTo) {
    const d = new Date(startTo);
    if (!isNaN(d)) {
      query.startDate = query.startDate || {};
      d.setDate(d.getDate() + 1);
      query.startDate.$lt = d;
    }
  }
  if (endFrom) {
    const d = new Date(endFrom);
    if (!isNaN(d)) {
      query.endDate = query.endDate || {};
      query.endDate.$gte = d;
    }
  }
  if (endTo) {
    const d = new Date(endTo);
    if (!isNaN(d)) {
      query.endDate = query.endDate || {};
      d.setDate(d.getDate() + 1);
      query.endDate.$lt = d;
    }
  }
  if (dueFrom) {
    const d = new Date(dueFrom);
    if (!isNaN(d)) {
      query.dueDate = query.dueDate || {};
      query.dueDate.$gte = d;
    }
  }
  if (dueTo) {
    const d = new Date(dueTo);
    if (!isNaN(d)) {
      d.setDate(d.getDate() + 1);
      query.dueDate = query.dueDate || {};
      query.dueDate.$lt = d;
    }
  }

  return { query, q };
}

// Resolve client IDs to display names (codigo + nome) and attach as clientName
export async function enrichActionsWithClientName(actions) {
  try {
    const clientIds = Array.from(
      new Set(
        actions
          .map((a) => String(a.client || ""))
          .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      )
    );
    if (!clientIds.length) return actions;

    const clientes = await Cliente.find({ _id: { $in: clientIds } })
      .select("_id nome codigo")
      .lean()
      .exec();
    const map = new Map(
      clientes.map((c) => [
        String(c._id),
        `${c.codigo ? c.codigo + " " : ""}${c.nome || ""}`.trim(),
      ])
    );
    for (const a of actions) {
      const id = String(a.client || "");
      if (map.has(id)) a.clientName = map.get(id);
    }
  } catch {
    void 0; /* noop: ignore client name resolution errors */
  }
  return actions;
}

// Narrow staff list to entries matching query q (case-insensitive) when q is present
export function narrowStaffByQuery(actions, q) {
  if (!q) return actions;
  const qLower = q.toLowerCase();
  for (const a of actions) {
    const staffList = Array.isArray(a.staff) ? a.staff : [];
    const hasStaffMatch = staffList.some(
      (s) =>
        String(s?.name || "").toLowerCase().includes(qLower) ||
        String(s?.pix || "").toLowerCase().includes(qLower) ||
        String(s?.bank || "").toLowerCase().includes(qLower)
    );
    if (hasStaffMatch) {
      a.staff = staffList.filter(
        (s) =>
          String(s?.name || "").toLowerCase().includes(qLower) ||
          String(s?.pix || "").toLowerCase().includes(qLower) ||
          String(s?.bank || "").toLowerCase().includes(qLower)
      );
    }
  }
  return actions;
}

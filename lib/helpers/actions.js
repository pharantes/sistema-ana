/* eslint-env node */
import Cliente from "../db/models/Cliente.js";

// Utility functions
function escapeRegex(searchString) {
  return searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseLooseDate(dateText) {
  if (!dateText) return null;

  const normalized = String(dateText).trim().replace(/-/g, "/");
  const parts = normalized.split("/");

  if (parts.length !== 3) return null;

  let parsedDate = null;

  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    parsedDate = new Date(year, month - 1, day);
  } else if (parts[0].length === 2) {
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    parsedDate = new Date(year, month - 1, day);
  }

  return parsedDate && !isNaN(parsedDate) ? parsedDate : null;
}

function parseStaffFromString(staffString) {
  const parts = staffString.split("-");
  const name = (parts[0] || "").trim();
  const valueTxt = (parts[1] || "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = parseFloat(valueTxt) || 0;
  return { name, value };
}

function parseStaffFromObject(staffObject) {
  const name = (staffObject.name || "").trim();
  const value = Number(staffObject.value) || 0;
  const pix = (staffObject.pix || "").trim();
  const bank = (staffObject.bank || "").trim();
  const pgt = (staffObject.pgt || "").trim();
  const vencimento = staffObject.vencimento ? new Date(staffObject.vencimento) : undefined;

  return { name, value, pix, bank, pgt, vencimento };
}

function isValidStaffEntry(staffEntry) {
  return staffEntry.name && Number.isFinite(staffEntry.value);
}

/**
 * Normalizes staff array from mixed input formats (string or object).
 */
export function normalizeStaffArray(staff) {
  if (!Array.isArray(staff)) return undefined;

  const normalized = staff
    .map((staffItem) => {
      if (typeof staffItem === "string") {
        return parseStaffFromString(staffItem);
      }
      return parseStaffFromObject(staffItem);
    })
    .filter(isValidStaffEntry);

  return normalized;
}

function parseCostObject(cost) {
  return {
    description: String(cost.description || "").trim(),
    value: Number(cost.value) || 0,
    pix: (cost.pix || "").trim(),
    bank: (cost.bank || "").trim(),
    pgt: (cost.pgt || "").trim(),
    vencimento: cost.vencimento ? new Date(cost.vencimento) : undefined,
    colaboradorId: cost.colaboradorId || undefined,
    vendorName: (cost.vendorName || "").trim(),
    vendorEmpresa: (cost.vendorEmpresa || "").trim(),
    _id: cost._id,
  };
}

function isValidCostEntry(cost) {
  return cost.description && Number.isFinite(cost.value);
}

/**
 * Normalizes costs array from input format.
 */
export function normalizeCostsArray(costs) {
  if (!Array.isArray(costs)) return undefined;

  return costs
    .map(parseCostObject)
    .filter(isValidCostEntry);
}

function extractSearchParams(searchParams) {
  return {
    searchQuery: (searchParams.get("q") || "").trim(),
    clientId: (searchParams.get("clientId") || "").trim(),
    colaboradorId: (searchParams.get("colaboradorId") || "").trim(),
    colaboradorName: (searchParams.get("colaboradorName") || "").trim(),
    startFrom: (searchParams.get("startFrom") || "").trim(),
    startTo: (searchParams.get("startTo") || "").trim(),
    endFrom: (searchParams.get("endFrom") || "").trim(),
    endTo: (searchParams.get("endTo") || "").trim(),
    dueFrom: (searchParams.get("dueFrom") || searchParams.get("vencFrom") || "").trim(),
    dueTo: (searchParams.get("dueTo") || searchParams.get("vencTo") || "").trim(),
  };
}

function isValidMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function addClientIdFilter(query, clientId) {
  if (isValidMongoId(clientId)) {
    query.client = clientId;
  }
}

function createTextSearchConditions(searchQuery) {
  const safeQuery = escapeRegex(searchQuery);
  return [
    { name: { $regex: safeQuery, $options: "i" } },
    { event: { $regex: safeQuery, $options: "i" } },
    { paymentMethod: { $regex: safeQuery, $options: "i" } },
    { createdBy: { $regex: safeQuery, $options: "i" } },
    { "staff.name": { $regex: safeQuery, $options: "i" } },
    { "staff.pix": { $regex: safeQuery, $options: "i" } },
    { "staff.bank": { $regex: safeQuery, $options: "i" } },
  ];
}

async function addClientMatchingConditions(orConditions, searchQuery) {
  try {
    const safeQuery = escapeRegex(searchQuery);
    const matchingClients = await Cliente.find({
      $or: [
        { nome: { $regex: safeQuery, $options: "i" } },
        { codigo: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select("_id")
      .lean()
      .exec();

    if (matchingClients.length > 0) {
      const clientIds = matchingClients.map((client) => String(client._id));
      orConditions.push({ client: { $in: clientIds } });
    }
  } catch {
    // Ignore client lookup errors
  }
}

function addDateMatchingConditions(orConditions, searchQuery) {
  const dateMatch = parseLooseDate(searchQuery);

  if (!dateMatch) return;

  const nextDay = new Date(dateMatch);
  nextDay.setDate(nextDay.getDate() + 1);

  const createDayRange = (field) => ({
    [field]: { $gte: dateMatch, $lt: nextDay }
  });

  orConditions.push(
    createDayRange("date"),
    createDayRange("startDate"),
    createDayRange("endDate"),
    createDayRange("dueDate"),
    createDayRange("createdAt")
  );
}

async function addSearchQueryFilter(query, searchQuery) {
  if (!searchQuery) return;

  const orConditions = createTextSearchConditions(searchQuery);
  await addClientMatchingConditions(orConditions, searchQuery);
  addDateMatchingConditions(orConditions, searchQuery);

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }
}

function addColaboradorFilters(query, colaboradorId, colaboradorName) {
  if (!colaboradorId && !colaboradorName) return;

  const colaboradorConditions = [];

  if (isValidMongoId(colaboradorId)) {
    colaboradorConditions.push({ "costs.colaboradorId": colaboradorId });
  }

  if (colaboradorName) {
    const safeColaboradorName = escapeRegex(colaboradorName);
    colaboradorConditions.push(
      { "staff.name": { $regex: safeColaboradorName, $options: "i" } },
      { "costs.vendorName": { $regex: safeColaboradorName, $options: "i" } }
    );
  }

  if (colaboradorConditions.length > 0) {
    if (Array.isArray(query.$or)) {
      query.$or = query.$or.concat(colaboradorConditions);
    } else {
      query.$or = colaboradorConditions;
    }
  }
}

function addDateRangeFilter(query, fieldName, fromDate, toDate) {
  if (fromDate) {
    const startDate = new Date(fromDate);
    if (!isNaN(startDate)) {
      query[fieldName] = query[fieldName] || {};
      query[fieldName].$gte = startDate;
    }
  }

  if (toDate) {
    const endDate = new Date(toDate);
    if (!isNaN(endDate)) {
      query[fieldName] = query[fieldName] || {};
      endDate.setDate(endDate.getDate() + 1);
      query[fieldName].$lt = endDate;
    }
  }
}

/**
 * Builds a MongoDB query from search parameters for action filtering.
 * Returns an object with the constructed query and original search string.
 */
export async function buildActionsQuery(searchParams) {
  const params = extractSearchParams(searchParams);
  const query = {};

  addClientIdFilter(query, params.clientId);
  await addSearchQueryFilter(query, params.searchQuery);
  addColaboradorFilters(query, params.colaboradorId, params.colaboradorName);

  addDateRangeFilter(query, 'startDate', params.startFrom, params.startTo);
  addDateRangeFilter(query, 'endDate', params.endFrom, params.endTo);
  addDateRangeFilter(query, 'dueDate', params.dueFrom, params.dueTo);

  return { query, q: params.searchQuery };
}

function extractUniqueClientIds(actions) {
  return Array.from(
    new Set(
      actions
        .map((action) => String(action.client || ""))
        .filter(isValidMongoId)
    )
  );
}

function formatClientDisplayName(client) {
  const codigoPart = client.codigo ? `${client.codigo} ` : "";
  const nomePart = client.nome || "";
  return `${codigoPart}${nomePart}`.trim();
}

function createClientNameMap(clientes) {
  return new Map(
    clientes.map((client) => [
      String(client._id),
      formatClientDisplayName(client)
    ])
  );
}

/**
 * Enriches actions with client display names by resolving client IDs.
 * Adds a `clientName` property to each action containing the client's code and name.
 */
export async function enrichActionsWithClientName(actions) {
  try {
    const clientIds = extractUniqueClientIds(actions);

    if (clientIds.length === 0) {
      return actions;
    }

    const clientes = await Cliente.find({ _id: { $in: clientIds } })
      .select("_id nome codigo")
      .lean()
      .exec();

    const clientNameMap = createClientNameMap(clientes);

    for (const action of actions) {
      const clientId = String(action.client || "");
      if (clientNameMap.has(clientId)) {
        action.clientName = clientNameMap.get(clientId);
      }
    }
  } catch {
    // Ignore client name resolution errors
  }

  return actions;
}

function staffMatchesQuery(staffMember, queryLower) {
  return (
    String(staffMember?.name || "").toLowerCase().includes(queryLower) ||
    String(staffMember?.pix || "").toLowerCase().includes(queryLower) ||
    String(staffMember?.bank || "").toLowerCase().includes(queryLower)
  );
}

/**
 * Filters staff members in actions to only those matching the search query.
 * Performs case-insensitive matching on staff name, pix, and bank fields.
 */
export function narrowStaffByQuery(actions, searchQuery) {
  if (!searchQuery) return actions;

  const queryLower = searchQuery.toLowerCase();

  for (const action of actions) {
    const staffList = Array.isArray(action.staff) ? action.staff : [];
    const hasMatch = staffList.some((staff) => staffMatchesQuery(staff, queryLower));

    if (hasMatch) {
      action.staff = staffList.filter((staff) => staffMatchesQuery(staff, queryLower));
    }
  }

  return actions;
}

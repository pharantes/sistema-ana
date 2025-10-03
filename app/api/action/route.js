import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { cookies } from "next/headers";
import User from "../../../lib/db/models/User.js";
import dbConnect from "../../../lib/db/connect.js";
import Action from "../../../lib/db/models/Action.js";
import Cliente from "../../../lib/db/models/Cliente.js";
import Servidor from "../../../lib/db/models/Servidor.js";

function buildFilterFromQuery(url) {
  const { searchParams } = new URL(url);
  const q = (searchParams.get("q") || "").trim();
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const filter = {};
  if (q) {
    const regex = new RegExp(q, "i");
    filter.$or = [
      { name: regex },
      { event: regex },
      { client: regex },
      { paymentMethod: regex },
      { staff: { $elemMatch: { name: { $regex: regex } } } },
      { staff: { $elemMatch: { bank: { $regex: regex } } } },
      { staff: { $elemMatch: { pix: { $regex: regex } } } },
    ];
  }
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = new Date(start);
    if (end) filter.createdAt.$lte = new Date(end);
  }
  return filter;
}

async function getSessionOrCookieUser() {
  const session = await getServerSession(authOptions);
  if (session && session.user) return session;

  try {
    const jar = cookies();
    const auth = jar.get("auth");
    if (!auth || !auth.value) return null;
    await dbConnect();
    const user = await User.findById(auth.value).lean();
    if (!user) return null;
    return { user: { id: String(user._id), username: user.username, role: user.role } };
  } catch {
    return null;
  }
}

export async function GET(request) {
  const session = await getSessionOrCookieUser();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  await dbConnect();

  const url = request.url;
  const { searchParams } = new URL(url);
  const q = (searchParams.get("q") || "").trim();
  const regex = q ? new RegExp(q, "i") : null;

  const filter = buildFilterFromQuery(url);
  const actions = await Action.find(filter).sort({ createdAt: -1 }).lean();

  if (regex) {
    for (const a of actions) {
      const staffList = Array.isArray(a.staff) ? a.staff : [];
      const hasStaffMatch = staffList.some((s) => regex.test(s?.name || "") || regex.test(s?.pix || "") || regex.test(s?.bank || ""));
      if (hasStaffMatch) {
        a.staff = staffList.filter((s) => regex.test(s?.name || "") || regex.test(s?.pix || "") || regex.test(s?.bank || ""));
      }
    }
  }

  return new Response(JSON.stringify(actions), { status: 200 });
}

export async function POST(request) {
  const session = await getSessionOrCookieUser();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  await dbConnect();
  const body = await request.json();
  const { name, event, client, date, paymentMethod, dueDate, staff } = body;

  if (!Array.isArray(staff) || staff.length === 0) {
    return new Response(JSON.stringify({ error: "At least one staff entry is required" }), { status: 400 });
  }

  // If staff entries reference servidores by _id, fetch them and combine stored pix/bank
  const staffInput = Array.isArray(staff) ? staff : [];
  const servidorIds = staffInput.filter(s => s && s._id).map(s => s._id);
  let servidoresMap = {};
  if (servidorIds.length) {
    const servs = await Servidor.find({ _id: { $in: servidorIds } }).lean();
    servidoresMap = servs.reduce((acc, cur) => { acc[String(cur._id)] = cur; return acc; }, {});
  }

  function parseCurrencyServer(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const cleaned = String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  const normalizedStaff = staffInput
    .map((s) => {
      if (s && s._id && servidoresMap[String(s._id)]) {
        const serv = servidoresMap[String(s._id)];
        const value = parseCurrencyServer(s.value);
        return { name: serv.nome || serv.name || '', value, pix: serv.pix || '', bank: serv.banco || '' };
      }
      if (typeof s === "string") {
        const parts = s.split("-");
        const name = (parts[0] || "").trim();
        const valueTxt = (parts[1] || "").replace(/[^0-9.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
        const value = parseFloat(valueTxt) || 0;
        return { name, value };
      }
      const name = (s.name || "").trim();
      const value = parseCurrencyServer(s.value);
      const pix = (s.pix || "").trim();
      const bank = (s.bank || "").trim();
      return { name, value, pix, bank };
    })
    .filter((s) => s.name && Number.isFinite(s.value));

  if (normalizedStaff.length === 0) {
    return new Response(JSON.stringify({ error: "At least one valid staff entry is required" }), { status: 400 });
  }

  // resolve client id to client name when possible
  let clientName = client;
  try {
    // if client looks like an ObjectId, attempt to fetch
    if (client && /^[0-9a-fA-F]{24}$/.test(String(client))) {
      const cli = await Cliente.findById(client).lean();
      if (cli) clientName = cli.nome || cli.name || String(client);
    }
  } catch (err) {
    // ignore and keep provided client
  }

  const action = await Action.create({
    name,
    event,
    client: clientName,
    date: date ? new Date(date) : undefined,
    paymentMethod,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    staff: normalizedStaff,
    createdBy: session.user.username,
  });
  return new Response(JSON.stringify(action), { status: 201 });
}

export async function DELETE(request) {
  const session = await getSessionOrCookieUser();
  if (!session || !session.user || session.user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }
  const deleted = await Action.findByIdAndDelete(id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: "Action not found" }), { status: 404 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

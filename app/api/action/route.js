import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "../../../lib/db/connect.js";
import Action from "../../../lib/db/models/Action.js";

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

export async function GET(request) {
  const session = await getServerSession(authOptions);
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  await dbConnect();
  const body = await request.json();
  const { name, event, client, date, paymentMethod, dueDate, staff } = body;

  if (!Array.isArray(staff) || staff.length === 0) {
    return new Response(JSON.stringify({ error: "At least one staff entry is required" }), { status: 400 });
  }

  const normalizedStaff = staff
    .map((s) => {
      if (typeof s === "string") {
        const parts = s.split("-");
        const name = (parts[0] || "").trim();
        const valueTxt = (parts[1] || "").replace(/[^0-9.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
        const value = parseFloat(valueTxt) || 0;
        return { name, value };
      }
      const name = (s.name || "").trim();
      const value = Number(s.value) || 0;
      const pix = (s.pix || "").trim();
      const bank = (s.bank || "").trim();
      return { name, value, pix, bank };
    })
    .filter((s) => s.name && Number.isFinite(s.value));

  if (normalizedStaff.length === 0) {
    return new Response(JSON.stringify({ error: "At least one valid staff entry is required" }), { status: 400 });
  }

  const action = await Action.create({
    name,
    event,
    client,
    date: date ? new Date(date) : undefined,
    paymentMethod,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    staff: normalizedStaff,
    createdBy: session.user.username,
  });
  return new Response(JSON.stringify(action), { status: 201 });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
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

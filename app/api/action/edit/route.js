import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";

function normalizeStaffArray(staff) {
  if (!Array.isArray(staff)) return undefined;
  const normalized = staff
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
  return normalized;
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  await dbConnect();
  const body = await request.json();
  const { id, ...update } = body;
  let action = await Action.findById(id);
  if (!action) return new Response(JSON.stringify({ error: "Action not found" }), { status: 404 });

  if (session.user.role !== "admin") {
    // Staff can edit only if they are listed in staff entries (by name match)
    const names = (action.staff || []).map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean);
    if (!names.includes(session.user.username)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
  }

  if (update.date) update.date = new Date(update.date);
  if (update.dueDate) update.dueDate = new Date(update.dueDate);
  if (update.staff) update.staff = normalizeStaffArray(update.staff);

  Object.assign(action, update);
  await action.save();
  return new Response(JSON.stringify(action), { status: 200 });
}

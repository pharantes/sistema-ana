import { getServerSession } from "next-auth";
import baseOptions from "../../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../../lib/db/connect.js";
import Action from "../../../../../lib/db/models/Action.js";
import ContasAPagar from "../../../../../lib/db/models/ContasAPagar.js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, context) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const params = await (context?.params);
    const { id } = params || {};
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
    }

    await dbConnect();
    const action = await Action.findById(id).lean();
    if (!action) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404 });
    }

    // Build a simple PDF with key info
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const page = pdf.addPage([595.28, 841.89]); // A4 portrait
    let y = 800;
    const draw = (text, size = 12) => {
      page.drawText(String(text ?? ""), { x: 50, y, size, font });
      y -= size + 8;
    };
    draw("Relatório da Ação", 18);
    draw(`Nome da ação: ${action.name || ""}`);
    draw(`Cliente: ${action.client || ""}`);
    draw(`Data: ${action.date ? new Date(action.date).toLocaleDateString("pt-BR") : ""}`);
    draw(`Vencimento: ${action.dueDate ? new Date(action.dueDate).toLocaleDateString("pt-BR") : ""}`);
    draw(`Forma de pagamento: ${action.paymentMethod || ""}`);

    const staff = Array.isArray(action.staff) ? action.staff : [];
    draw("Profissionais:", 14);
    for (const s of staff) {
      draw(`- ${s?.name || ""} | Banco: ${s?.bank || ""} | PIX: ${s?.pix || ""} | Valor: R$ ${(Number(s?.value || 0)).toFixed(2)}`);
    }

    const bytes = await pdf.save();

    // Persist file under public/reports (safe, validated path)
    const reportsDir = path.join(process.cwd(), "public", "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const isValidId = /^[0-9a-fA-F]{24}$/.test(String(id));
    const safeBase = isValidId ? String(id) : String(Date.now());
    const fileName = `${safeBase}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    // filePath is constructed from a constant base directory and a validated filename
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, Buffer.from(bytes));
    const pdfUrl = `/reports/${fileName}`;

    // Create ContasAPagar entry
    const conta = await ContasAPagar.create({
      actionId: action._id,
      reportDate: new Date(),
      pdfUrl,
      status: 'ABERTO',
    });

    return new Response(JSON.stringify({ conta, pdfUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    try { process?.stderr?.write("report generate error: " + String(err && err.stack ? err.stack : err) + "\n"); } catch { /* noop */ }
    return new Response(JSON.stringify({ error: "Failed to generate report" }), { status: 500 });
  }
}



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const regex = q ? new RegExp(q, "i") : null;

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: regex } },
        { event: { $regex: regex } },
        { client: { $regex: regex } },
        { paymentMethod: { $regex: regex } },
        { staff: { $elemMatch: { name: { $regex: regex } } } },
        { staff: { $elemMatch: { pix: { $regex: regex } } } },
        { staff: { $elemMatch: { bank: { $regex: regex } } } },
      ];
    }
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lte = new Date(end);
    }

    const actions = await Action.find(filter).sort({ createdAt: -1 }).lean();

    if (regex) {
      for (const a of actions) {
        const staffList = Array.isArray(a.staff) ? a.staff : [];
        const hasStaffMatch = staffList.some(
          (s) =>
            regex.test(s?.name || "") ||
            regex.test(s?.pix || "") ||
            regex.test(s?.bank || "")
        );
        if (hasStaffMatch) {
          a.staff = staffList.filter(
            (s) =>
              regex.test(s?.name || "") ||
              regex.test(s?.pix || "") ||
              regex.test(s?.bank || "")
          );
        }
      }
    }

    const rows = [];
    for (const a of actions) {
      const staffList = Array.isArray(a.staff) ? a.staff : [];
      if (staffList.length === 0) continue;
      for (const s of staffList) {
        rows.push({
          date: a.date ? new Date(a.date) : null,
          paymentMethod: a.paymentMethod || "",
          client: a.client || "",
          staffName: s?.name || "",
          event: a.name || a.event || "",
          value: Number(s?.value || 0),
          dueDate: a.dueDate ? new Date(a.dueDate) : null,
          pix: s?.pix || "",
          bank: s?.bank || "",
        });
      }
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageMargin = 40;
    const fontSize = 9;
    const lineHeight = 12;

    // A4 landscape
    let page = pdfDoc.addPage([841.89, 595.28]);
    let { width, height } = page.getSize();
    let cursorY = height - pageMargin;

    const drawText = (text, x, y, size = fontSize, color = rgb(0, 0, 0)) => {
      page.drawText(String(text ?? ""), { x, y, size, color, font });
    };
    const newPage = () => {
      page = pdfDoc.addPage([841.89, 595.28]);
      ({ width, height } = page.getSize());
      cursorY = height - pageMargin;
    };
    const moveDown = (lines = 1) => {
      cursorY -= lines * lineHeight;
      if (cursorY < pageMargin) newPage();
    };

    const wrapByWidth = (text, colWidth, size = fontSize) => {
      const words = String(text || "").split(/\s+/);
      const lines = [];
      let line = "";
      const spaceW = font.widthOfTextAtSize(" ", size);
      for (const word of words) {
        const wordW = font.widthOfTextAtSize(word, size);
        const lineW = font.widthOfTextAtSize(line, size);
        if (line && lineW + spaceW + wordW > colWidth) {
          lines.push(line);
          line = word;
        } else {
          line = line ? line + " " + word : word;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [""];
    };

    const widths = {
      date: 60,
      pgt: 55,
      client: 120,
      staff: 150,
      event: 95,
      value: 55,
      due: 70,
      pix: 90,
      bank: 50,
    };
    const positions = {
      date: pageMargin,
      pgt: pageMargin + widths.date,
      client: pageMargin + widths.date + widths.pgt,
      staff: pageMargin + widths.date + widths.pgt + widths.client,
      event:
        pageMargin + widths.date + widths.pgt + widths.client + widths.staff,
      value:
        pageMargin +
        widths.date +
        widths.pgt +
        widths.client +
        widths.staff +
        widths.event,
      due:
        pageMargin +
        widths.date +
        widths.pgt +
        widths.client +
        widths.staff +
        widths.event +
        widths.value,
      pix:
        pageMargin +
        widths.date +
        widths.pgt +
        widths.client +
        widths.staff +
        widths.event +
        widths.value +
        widths.due,
      bank:
        pageMargin +
        widths.date +
        widths.pgt +
        widths.client +
        widths.staff +
        widths.event +
        widths.value +
        widths.due +
        widths.pix,
    };

    // Header
    drawText("Relatório de Ações", pageMargin, cursorY - 16, 16);
    moveDown(1.5);
    drawText(
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      pageMargin,
      cursorY - 10,
      8.5,
      rgb(0.4, 0.4, 0.4)
    );
    moveDown(1.2);

    // Table header
    drawText("Data", positions.date, cursorY - fontSize, 10.5);
    drawText("Pgt", positions.pgt, cursorY - fontSize, 10.5);
    drawText("Cliente", positions.client, cursorY - fontSize, 10.5);
    drawText("Profissional", positions.staff, cursorY - fontSize, 10.5);
    drawText("Evento", positions.event, cursorY - fontSize, 10.5);
    drawText("Valor", positions.value, cursorY - fontSize, 10.5);
    drawText("Vencimento", positions.due, cursorY - fontSize, 10.5);
    drawText("PIX", positions.pix, cursorY - fontSize, 10.5);
    drawText("Banco", positions.bank, cursorY - fontSize, 10.5);
    moveDown(1);
    page.drawLine({
      start: { x: pageMargin, y: cursorY },
      end: { x: width - pageMargin, y: cursorY },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    moveDown(0.6);

    let overallTotal = 0;

    // Draw rows
    for (const r of rows) {
      const dateStr = r.date ? r.date.toLocaleDateString("pt-BR") : "";
      const dueStr = r.dueDate ? r.dueDate.toLocaleDateString("pt-BR") : "";

      const clientLines = wrapByWidth(r.client, widths.client);
      const staffLines = wrapByWidth(r.staffName, widths.staff);
      const eventLines = wrapByWidth(r.event, widths.event);
      const pixLines = wrapByWidth(r.pix, widths.pix);
      const bankLines = wrapByWidth(r.bank, widths.bank);

      const lineCount = Math.max(
        clientLines.length,
        staffLines.length,
        eventLines.length,
        pixLines.length,
        bankLines.length,
        1
      );

      moveDown(0.2);

      for (let i = 0; i < lineCount; i++) {
        const y = cursorY - (fontSize + 1);
        if (i === 0) {
          drawText(dateStr, positions.date, y);
          drawText(r.paymentMethod, positions.pgt, y);
          drawText(`R$ ${r.value.toFixed(2)}`, positions.value, y);
          drawText(dueStr, positions.due, y);
        }
        if (clientLines[i]) drawText(clientLines[i], positions.client, y);
        if (staffLines[i]) drawText(staffLines[i], positions.staff, y);
        if (eventLines[i]) drawText(eventLines[i], positions.event, y);
        if (pixLines[i]) drawText(pixLines[i], positions.pix, y);
        if (bankLines[i]) drawText(bankLines[i], positions.bank, y);

        moveDown(1);
      }

      // separator line below the row
      page.drawLine({
        start: { x: pageMargin, y: cursorY },
        end: { x: width - pageMargin, y: cursorY },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      moveDown(0.6);

      overallTotal += r.value;
    }

    moveDown(1);
    const overallText = `Total geral: R$ ${overallTotal.toFixed(2)}`;
    const overallSize = 12;
    const overallWidth = font.widthOfTextAtSize(overallText, overallSize);
    const overallX = Math.max(pageMargin, width - pageMargin - overallWidth);
    drawText(overallText, overallX, cursorY - overallSize, overallSize);

    const pdfBytes = await pdfDoc.save();
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=actions_report.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation error", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

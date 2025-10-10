/* eslint-env node */
/* eslint-disable no-console, security/detect-non-literal-regexp */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import baseOptions from "../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../lib/db/connect.js";
import Action from "../../../../lib/db/models/Action.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { actionReportColumns, actionReportWidths } from "../../../utils/columns.js";
import { formatDateBR, formatDateTimeBR } from "@/lib/utils/dates";
import Cliente from "../../../../lib/db/models/Cliente.js";
import { forbidden, serverError, badRequest } from "../../../../lib/api/responses";
import { rateLimit } from "../../../../lib/utils/rateLimit";

const idFn = (req) => req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 10, idFn });

export async function GET(request) {
  try {
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== "admin") return forbidden();

    getLimiter.check(request);

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const acaoFrom = searchParams.get("acaoFrom");
    const acaoTo = searchParams.get("acaoTo");
    const vencFrom = searchParams.get("vencFrom");
    const vencTo = searchParams.get("vencTo");
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
    if (acaoFrom || acaoTo) {
      filter.createdAt = {};
      if (acaoFrom) {
        const d = new Date(acaoFrom);
        if (isNaN(d)) return badRequest('Invalid acaoFrom');
        filter.createdAt.$gte = d;
      }
      if (acaoTo) {
        const d = new Date(acaoTo);
        if (isNaN(d)) return badRequest('Invalid acaoTo');
        d.setDate(d.getDate() + 1);
        filter.createdAt.$lt = d;
      }
    }
    if (vencFrom || vencTo) {
      filter.dueDate = filter.dueDate || {};
      if (vencFrom) {
        const d = new Date(vencFrom);
        if (isNaN(d)) return badRequest('Invalid vencFrom');
        filter.dueDate.$gte = d;
      }
      if (vencTo) {
        const d = new Date(vencTo);
        if (isNaN(d)) return badRequest('Invalid vencTo');
        d.setDate(d.getDate() + 1);
        filter.dueDate.$lt = d;
      }
    }

    const actions = await Action.find(filter).sort({ createdAt: -1 }).lean();

    // Resolve client IDs to display names for report
    try {
      const clientIds = Array.from(new Set(
        actions
          .map(a => String(a.client || ''))
          .filter(id => /^[0-9a-fA-F]{24}$/.test(id))
      ));
      if (clientIds.length) {
        const clientes = await Cliente.find({ _id: { $in: clientIds } })
          .select('_id nome codigo')
          .lean()
          .exec();
        const map = new Map(clientes.map(c => [String(c._id), `${c.codigo ? c.codigo + ' ' : ''}${c.nome || ''}`.trim()]));
        for (const a of actions) {
          const id = String(a.client || '');
          if (map.has(id)) a.clientName = map.get(id);
        }
      }
    } catch { /* ignore client name resolution */ }

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
          startDate: a.startDate ? new Date(a.startDate) : null,
          endDate: a.endDate ? new Date(a.endDate) : null,
          paymentMethod: s?.pgt || a.paymentMethod || "",
          client: a.clientName || a.client || "",
          staffName: s?.name || "",
          event: a.name || a.event || "",
          value: Number(s?.value || 0),
          dueDate: (s?.vencimento ? new Date(s.vencimento) : (a.dueDate ? new Date(a.dueDate) : null)),
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

    // Column widths and x positions derived from shared config
    const widths = actionReportColumns.reduce((acc, col) => {
      acc[col.key] = actionReportWidths[col.key] || 60;
      return acc;
    }, {});
    const positions = {};
    {
      let x = pageMargin;
      for (const col of actionReportColumns) {
        positions[col.key] = x;
        x += widths[col.key] || 0;
      }
    }

    // Header
    drawText("Relatório de Ações", pageMargin, cursorY - 16, 16);
    moveDown(1.5);
    drawText(
      `Gerado em: ${formatDateTimeBR(new Date())}`,
      pageMargin,
      cursorY - 10,
      8.5,
      rgb(0.4, 0.4, 0.4)
    );
    moveDown(1.2);

    // Table header (aligned with shared UI order)
    for (const col of actionReportColumns) {
      drawText(col.label, positions[col.key], cursorY - fontSize, 10.5);
    }
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
      const dateStr = formatDateBR(r.date);
      const startStr = formatDateBR(r.startDate);
      const endStr = formatDateBR(r.endDate);
      const dueStr = formatDateBR(r.dueDate);

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
          drawText(startStr, positions.start, y);
          drawText(endStr, positions.end, y);
          drawText(`R$ ${r.value.toFixed(2)}`, positions.value, y);
          drawText(dueStr, positions.due, y);
          drawText(r.paymentMethod, positions.pgt, y);
        }
        if (eventLines[i]) drawText(eventLines[i], positions.event, y);
        if (clientLines[i]) drawText(clientLines[i], positions.client, y);
        if (staffLines[i]) drawText(staffLines[i], positions.staff, y);
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
    try { console.error("PDF generation error", err); } catch { /* noop */ }
    return serverError('Failed to generate PDF');
  }
}

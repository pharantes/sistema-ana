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

const getClientIp = (request) =>
  request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anon';
const getLimiter = rateLimit({ windowMs: 10_000, limit: 10, idFn: getClientIp });

/**
 * Builds MongoDB filter for action search based on query parameters.
 * @param {string} searchQuery - Text search query
 * @param {string} acaoFrom - Action creation date from (ISO format)
 * @param {string} acaoTo - Action creation date to (ISO format)
 * @param {string} vencFrom - Due date from (ISO format)
 * @param {string} vencTo - Due date to (ISO format)
 * @returns {{filter: object, regex: RegExp|null}} Filter object and compiled regex
 */
function buildActionFilter(searchQuery, acaoFrom, acaoTo, vencFrom, vencTo) {
  const filter = {};
  const regex = searchQuery ? new RegExp(searchQuery, "i") : null;

  if (searchQuery) {
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
      const fromDate = new Date(acaoFrom);
      if (isNaN(fromDate)) throw new Error('Invalid acaoFrom');
      filter.createdAt.$gte = fromDate;
    }
    if (acaoTo) {
      const toDate = new Date(acaoTo);
      if (isNaN(toDate)) throw new Error('Invalid acaoTo');
      toDate.setDate(toDate.getDate() + 1);
      filter.createdAt.$lt = toDate;
    }
  }

  if (vencFrom || vencTo) {
    filter.dueDate = {};
    if (vencFrom) {
      const fromDate = new Date(vencFrom);
      if (isNaN(fromDate)) throw new Error('Invalid vencFrom');
      filter.dueDate.$gte = fromDate;
    }
    if (vencTo) {
      const toDate = new Date(vencTo);
      if (isNaN(toDate)) throw new Error('Invalid vencTo');
      toDate.setDate(toDate.getDate() + 1);
      filter.dueDate.$lt = toDate;
    }
  }

  return { filter, regex };
}

/**
 * Resolves client IDs to display names for actions.
 * @param {Array} actions - Array of action objects
 * @returns {Promise<void>} Modifies actions in-place with clientName property
 */
async function resolveClientNames(actions) {
  try {
    const clientIds = Array.from(new Set(
      actions
        .map(action => String(action.client || ''))
        .filter(id => /^[0-9a-fA-F]{24}$/.test(id))
    ));

    if (clientIds.length) {
      const clientes = await Cliente.find({ _id: { $in: clientIds } })
        .select('_id nome codigo')
        .lean()
        .exec();
      const clientMap = new Map(
        clientes.map(cliente => [
          String(cliente._id),
          `${cliente.codigo ? cliente.codigo + ' ' : ''}${cliente.nome || ''}`.trim()
        ])
      );

      for (const action of actions) {
        const clientId = String(action.client || '');
        if (clientMap.has(clientId)) {
          action.clientName = clientMap.get(clientId);
        }
      }
    }
  } catch {
    /* ignore client name resolution errors */
  }
}

/**
 * Filters staff members in actions based on regex search.
 * @param {Array} actions - Array of action objects
 * @param {RegExp} regex - Regular expression for filtering
 * @returns {void} Modifies actions in-place
 */
function filterStaffBySearch(actions, regex) {
  for (const action of actions) {
    const staffList = Array.isArray(action.staff) ? action.staff : [];
    const hasStaffMatch = staffList.some(
      (staffMember) =>
        regex.test(staffMember?.name || "") ||
        regex.test(staffMember?.pix || "") ||
        regex.test(staffMember?.bank || "")
    );
    if (hasStaffMatch) {
      action.staff = staffList.filter(
        (staffMember) =>
          regex.test(staffMember?.name || "") ||
          regex.test(staffMember?.pix || "") ||
          regex.test(staffMember?.bank || "")
      );
    }
  }
}

/**
 * Converts actions to report rows (one row per staff member).
 * @param {Array} actions - Array of action objects
 * @returns {Array} Array of report row objects
 */
function convertActionsToRows(actions) {
  const rows = [];
  for (const action of actions) {
    const staffList = Array.isArray(action.staff) ? action.staff : [];
    if (staffList.length === 0) continue;

    for (const staffMember of staffList) {
      rows.push({
        date: action.date ? new Date(action.date) : null,
        startDate: action.startDate ? new Date(action.startDate) : null,
        endDate: action.endDate ? new Date(action.endDate) : null,
        paymentMethod: staffMember?.pgt || action.paymentMethod || "",
        client: action.clientName || action.client || "",
        staffName: staffMember?.name || "",
        event: action.name || action.event || "",
        value: Number(staffMember?.value || 0),
        dueDate: staffMember?.vencimento
          ? new Date(staffMember.vencimento)
          : (action.dueDate ? new Date(action.dueDate) : null),
        pix: staffMember?.pix || "",
        bank: staffMember?.bank || "",
      });
    }
  }
  return rows;
}

/**
 * Wraps text by width, breaking at word boundaries.
 * @param {string} text - Text to wrap
 * @param {number} columnWidth - Maximum width in points
 * @param {object} font - PDF font object
 * @param {number} fontSize - Font size
 * @returns {Array<string>} Array of wrapped lines
 */
function wrapTextByWidth(text, columnWidth, font, fontSize = 9) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let currentLine = "";
  const spaceWidth = font.widthOfTextAtSize(" ", fontSize);

  for (const word of words) {
    const wordWidth = font.widthOfTextAtSize(word, fontSize);
    const lineWidth = font.widthOfTextAtSize(currentLine, fontSize);

    if (currentLine && lineWidth + spaceWidth + wordWidth > columnWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [""];
}

/**
 * Calculates column widths and positions from configuration.
 * @returns {{widths: object, positions: object}} Column widths and x positions
 */
function calculateColumnLayout() {
  const widths = actionReportColumns.reduce((accumulator, column) => {
    accumulator[column.key] = actionReportWidths[column.key] || 60;
    return accumulator;
  }, {});

  const positions = {};
  const pageMargin = 40;
  let xPosition = pageMargin;
  for (const column of actionReportColumns) {
    positions[column.key] = xPosition;
    xPosition += widths[column.key] || 0;
  }

  return { widths, positions };
}

/**
 * GET endpoint for generating PDF reports of actions.
 * Supports filtering by text search, action dates, and due dates.
 * @param {Request} request - Next.js request object
 * @returns {Response} PDF file response or error
 */
export async function GET(request) {
  try {
    // Authenticate and rate limit
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return forbidden();
    }

    getLimiter.check(request);
    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get("q") || "").trim();
    const acaoFrom = searchParams.get("acaoFrom");
    const acaoTo = searchParams.get("acaoTo");
    const vencFrom = searchParams.get("vencFrom");
    const vencTo = searchParams.get("vencTo");

    // Build filter and fetch actions
    let filter, regex;
    try {
      ({ filter, regex } = buildActionFilter(searchQuery, acaoFrom, acaoTo, vencFrom, vencTo));
    } catch (error) {
      return badRequest(error.message);
    }

    const actions = await Action.find(filter).sort({ createdAt: -1 }).lean();

    // Resolve client names
    await resolveClientNames(actions);

    // Filter staff by search query if provided
    if (regex) {
      filterStaffBySearch(actions, regex);
    }

    // Convert actions to report rows
    const reportRows = convertActionsToRows(actions);

    // Initialize PDF document
    const pdfDocument = await PDFDocument.create();
    const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

    const pageMargin = 40;
    const fontSize = 9;
    const lineHeight = 12;

    // Calculate column layout
    const { widths: columnWidths, positions: columnPositions } = calculateColumnLayout();

    // A4 landscape dimensions
    let page = pdfDocument.addPage([841.89, 595.28]);
    let { width: pageWidth, height: pageHeight } = page.getSize();
    let currentY = pageHeight - pageMargin;

    /**
     * Draws text at specified position.
     * @param {string} text - Text to draw
     * @param {number} xPosition - X coordinate
     * @param {number} yPosition - Y coordinate
     * @param {number} textSize - Font size
     * @param {object} textColor - RGB color object
     */
    const drawText = (text, xPosition, yPosition, textSize = fontSize, textColor = rgb(0, 0, 0)) => {
      page.drawText(String(text ?? ""), { x: xPosition, y: yPosition, size: textSize, color: textColor, font });
    };

    /**
     * Adds a new page and resets cursor position.
     */
    const createNewPage = () => {
      page = pdfDocument.addPage([841.89, 595.28]);
      ({ width: pageWidth, height: pageHeight } = page.getSize());
      currentY = pageHeight - pageMargin;
    };

    /**
     * Moves cursor down by specified number of lines.
     * Creates new page if cursor reaches bottom margin.
     * @param {number} lineCount - Number of lines to move down
     */
    const moveCursorDown = (lineCount = 1) => {
      currentY -= lineCount * lineHeight;
      if (currentY < pageMargin) createNewPage();
    };

    // Draw title header
    drawText("Relatório de Ações", pageMargin, currentY - 16, 16);
    moveCursorDown(1.5);

    // Draw generation timestamp
    drawText(
      `Gerado em: ${formatDateTimeBR(new Date())}`,
      pageMargin,
      currentY - 10,
      8.5,
      rgb(0.4, 0.4, 0.4)
    );
    moveCursorDown(1.2);

    // Draw table header
    for (const column of actionReportColumns) {
      drawText(column.label, columnPositions[column.key], currentY - fontSize, 10.5);
    }
    moveCursorDown(1);

    // Draw header separator line
    page.drawLine({
      start: { x: pageMargin, y: currentY },
      end: { x: pageWidth - pageMargin, y: currentY },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    moveCursorDown(0.6);

    let totalValue = 0;

    // Draw data rows
    for (const rowData of reportRows) {
      const dateText = formatDateBR(rowData.date);
      const startDateText = formatDateBR(rowData.startDate);
      const endDateText = formatDateBR(rowData.endDate);
      const dueDateText = formatDateBR(rowData.dueDate);

      // Wrap multi-line text fields
      const clientLines = wrapTextByWidth(rowData.client, columnWidths.client, font, fontSize);
      const staffLines = wrapTextByWidth(rowData.staffName, columnWidths.staff, font, fontSize);
      const eventLines = wrapTextByWidth(rowData.event, columnWidths.event, font, fontSize);
      const pixLines = wrapTextByWidth(rowData.pix, columnWidths.pix, font, fontSize);
      const bankLines = wrapTextByWidth(rowData.bank, columnWidths.bank, font, fontSize);

      const totalLineCount = Math.max(
        clientLines.length,
        staffLines.length,
        eventLines.length,
        pixLines.length,
        bankLines.length,
        1
      );

      moveCursorDown(0.2);

      // Draw each line of the row
      for (let lineIndex = 0; lineIndex < totalLineCount; lineIndex++) {
        const yPosition = currentY - (fontSize + 1);

        // Draw single-line fields only on first line
        if (lineIndex === 0) {
          drawText(dateText, columnPositions.date, yPosition);
          drawText(startDateText, columnPositions.start, yPosition);
          drawText(endDateText, columnPositions.end, yPosition);
          drawText(`R$ ${rowData.value.toFixed(2)}`, columnPositions.value, yPosition);
          drawText(dueDateText, columnPositions.due, yPosition);
          drawText(rowData.paymentMethod, columnPositions.pgt, yPosition);
        }

        // Draw multi-line fields
        if (eventLines[lineIndex]) {
          drawText(eventLines[lineIndex], columnPositions.event, yPosition);
        }
        if (clientLines[lineIndex]) {
          drawText(clientLines[lineIndex], columnPositions.client, yPosition);
        }
        if (staffLines[lineIndex]) {
          drawText(staffLines[lineIndex], columnPositions.staff, yPosition);
        }
        if (pixLines[lineIndex]) {
          drawText(pixLines[lineIndex], columnPositions.pix, yPosition);
        }
        if (bankLines[lineIndex]) {
          drawText(bankLines[lineIndex], columnPositions.bank, yPosition);
        }

        moveCursorDown(1);
      }

      // Draw row separator line
      page.drawLine({
        start: { x: pageMargin, y: currentY },
        end: { x: pageWidth - pageMargin, y: currentY },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      moveCursorDown(0.6);

      totalValue += rowData.value;
    }

    // Draw grand total
    moveCursorDown(1);
    const totalText = `Total geral: R$ ${totalValue.toFixed(2)}`;
    const totalFontSize = 12;
    const totalTextWidth = font.widthOfTextAtSize(totalText, totalFontSize);
    const totalXPosition = Math.max(pageMargin, pageWidth - pageMargin - totalTextWidth);
    drawText(totalText, totalXPosition, currentY - totalFontSize, totalFontSize);

    const pdfBytes = await pdfDocument.save();
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

import { getServerSession } from "next-auth";
import baseOptions from "../../../../../lib/auth/authOptionsBase";
import dbConnect from "../../../../../lib/db/connect.js";
import Action from "../../../../../lib/db/models/Action.js";
import ContasAPagar from "../../../../../lib/db/models/ContasAPagar.js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { formatDateBR } from "@/lib/utils/dates";
import fs from "fs";
import path from "path";
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/api/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generates a simple PDF report for a specific action.
 * @param {object} action - Action document from database
 * @param {object} font - PDF font object
 * @returns {Promise<Uint8Array>} PDF bytes
 */
async function generateActionPDF(action, font) {
  const pdfDocument = await PDFDocument.create();
  const page = pdfDocument.addPage([595.28, 841.89]); // A4 portrait

  let currentY = 800;

  /**
   * Draws text and moves cursor down.
   * @param {string} text - Text to draw
   * @param {number} fontSize - Font size
   */
  const drawTextLine = (text, fontSize = 12) => {
    page.drawText(String(text ?? ""), { x: 50, y: currentY, size: fontSize, font });
    currentY -= fontSize + 8;
  };

  // Draw header and action details
  drawTextLine("Relatório da Ação", 18);
  drawTextLine(`Nome da ação: ${action.name || ""}`);
  drawTextLine(`Cliente: ${action.client || ""}`);
  drawTextLine(`Data: ${formatDateBR(action.date)}`);
  drawTextLine(`Vencimento: ${formatDateBR(action.dueDate)}`);
  drawTextLine(`Forma de pagamento: ${action.paymentMethod || ""}`);

  // Draw staff members section
  const staffList = Array.isArray(action.staff) ? action.staff : [];
  drawTextLine("Profissionais:", 14);
  for (const staffMember of staffList) {
    const staffValue = Number(staffMember?.value || 0).toFixed(2);
    const staffText = `- ${staffMember?.name || ""} | Banco: ${staffMember?.bank || ""} | PIX: ${staffMember?.pix || ""} | Valor: R$ ${staffValue}`;
    drawTextLine(staffText);
  }

  return await pdfDocument.save();
}

/**
 * Saves PDF bytes to the public/reports directory.
 * @param {Uint8Array} pdfBytes - PDF document bytes
 * @param {string} actionId - Action ID for filename
 * @returns {string} Public URL path to the saved PDF
 */
function savePDFToReportsDirectory(pdfBytes, actionId) {
  const reportsDirectory = path.join(process.cwd(), "public", "reports");

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDirectory)) {
    fs.mkdirSync(reportsDirectory, { recursive: true });
  }

  // Generate safe filename
  const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(String(actionId));
  const fileBaseName = isValidMongoId ? String(actionId) : String(Date.now());
  const fileName = `${fileBaseName}-${Date.now()}.pdf`;
  const filePath = path.join(reportsDirectory, fileName);

  // Write PDF to disk (filePath is constructed from constant base directory and validated filename)
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));

  return `/reports/${fileName}`;
}

/**
 * POST endpoint to generate a PDF report for a specific action.
 * Creates PDF, saves it to disk, and creates ContasAPagar entry.
 * @param {Request} request - Next.js request object
 * @param {object} context - Route context with params
 * @returns {Response} JSON response with conta and pdfUrl
 */
export async function POST(request, context) {
  try {
    // Authenticate
    const session = await getServerSession(baseOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return forbidden();
    }

    // Validate action ID
    const params = await (context?.params);
    const { id: actionId } = params || {};
    if (!actionId) {
      return badRequest('Missing id');
    }

    // Fetch action
    await dbConnect();
    const action = await Action.findById(actionId).lean();
    if (!action) {
      return notFound('Action not found');
    }

    // Generate PDF
    const font = await PDFDocument.create().then(doc => doc.embedFont(StandardFonts.Helvetica));
    const pdfBytes = await generateActionPDF(action, font);

    // Save PDF to disk
    const pdfUrl = savePDFToReportsDirectory(pdfBytes, actionId);

    // Create ContasAPagar entry
    const contaAPagar = await ContasAPagar.create({
      actionId: action._id,
      reportDate: new Date(),
      pdfUrl,
      status: 'ABERTO',
    });

    return ok({ conta: contaAPagar, pdfUrl });
  } catch (error) {
    try {
      const errorMessage = error && error.stack ? error.stack : error;
      process?.stderr?.write("report generate error: " + String(errorMessage) + "\n");
    } catch {
      /* noop */
    }
    return serverError('Failed to generate report');
  }
}



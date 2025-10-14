import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

/**
 * API endpoint to generate and download the Executive Summary as PDF
 * GET /api/resumo-executivo/pdf
 */
export async function GET() {
  try {
    // Read the markdown file from public directory
    const filePath = path.join(process.cwd(), 'public', 'RESUMO_EXECUTIVO.md');
    const markdown = await fs.readFile(filePath, 'utf-8');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Process markdown into simple text format
    const lines = markdown.split('\n');
    let currentY = 750;
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const margin = 50;
    const pageWidth = 595 - (margin * 2);
    const lineHeight = 14;

    function addNewPage() {
      page = pdfDoc.addPage([595, 842]);
      currentY = 750;
    }

    function drawText(text, fontSize, font, color = rgb(0, 0, 0)) {
      if (currentY < 50) {
        addNewPage();
      }

      // Remove emoji and special characters that WinAnsi can't encode
      // Only keep ASCII printable characters and common Latin-1 characters
      let cleanText = '';
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
          cleanText += text[i];
        }
      }
      cleanText = cleanText.trim();

      if (!cleanText) return;

      const textWidth = font.widthOfTextAtSize(cleanText, fontSize);

      // Handle text wrapping
      if (textWidth > pageWidth) {
        const words = cleanText.split(' ');
        let line = '';

        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth > pageWidth && line !== '') {
            page.drawText(line.trim(), {
              x: margin,
              y: currentY,
              size: fontSize,
              font: font,
              color: color,
            });
            currentY -= lineHeight;
            if (currentY < 50) addNewPage();
            line = word + ' ';
          } else {
            line = testLine;
          }
        }

        if (line.trim() !== '') {
          page.drawText(line.trim(), {
            x: margin,
            y: currentY,
            size: fontSize,
            font: font,
            color: color,
          });
          currentY -= lineHeight;
        }
      } else {
        page.drawText(cleanText, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
          color: color,
        });
        currentY -= lineHeight;
      }
    }

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines but add spacing
      if (line.trim() === '') {
        currentY -= 6;
        continue;
      }

      // Skip horizontal rules
      if (line.trim() === '---') {
        currentY -= 10;
        continue;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        drawText(line.substring(2), 20, helveticaBold, rgb(0.42, 0.17, 0.69));
        currentY -= 8;
      } else if (line.startsWith('## ')) {
        currentY -= 4;
        drawText(line.substring(3), 16, helveticaBold, rgb(0.42, 0.17, 0.69));
        currentY -= 6;
      } else if (line.startsWith('### ')) {
        drawText(line.substring(4), 14, helveticaBold, rgb(0.2, 0.2, 0.2));
        currentY -= 4;
      } else if (line.startsWith('**') || line.includes('**')) {
        // Bold text - just draw as regular for simplicity
        const cleanLine = line.replace(/\*\*/g, '');
        drawText(cleanLine, 11, helveticaBold);
      } else if (line.startsWith('- ') || line.startsWith('✅') || line.startsWith('❌')) {
        // List items
        drawText(line, 10, helveticaFont);
      } else if (line.startsWith('|')) {
        // Table rows - simplified
        const cleanLine = line.replace(/\|/g, ' | ').trim();
        drawText(cleanLine, 9, helveticaFont);
      } else {
        // Regular text
        const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
        if (cleanLine.trim() !== '') {
          drawText(cleanLine, 10, helveticaFont);
        }
      }
    }

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
      p.drawText(`Sistema Ana - Resumo Executivo | Página ${idx + 1} de ${pages.length}`, {
        x: margin,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Return as downloadable PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Sistema_Ana_Resumo_Executivo.pdf"',
      },
    });

  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error generating PDF:', error);
    }
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}

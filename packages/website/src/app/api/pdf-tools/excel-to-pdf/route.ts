import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const arrayBuf = await file.arrayBuffer();
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuf);

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 40;
    const lineHeight = 14;
    const cellPadding = 4;
    // Standard fonts only support WinAnsi (Latin-1); anything outside that
    // throws at draw time and would otherwise crash the whole conversion.
    const toSafeText = (value: unknown) => String(value ?? "").replace(/[^\x00-\xFF]/g, "?").substring(0, 30);

    workbook.eachSheet((worksheet) => {
      let page = doc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      page.drawText(toSafeText(worksheet.name) || "Sheet", {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 24;

      const colCount = worksheet.actualColumnCount || worksheet.columnCount || 5;
      const colWidth = Math.min(150, (pageWidth - margin * 2) / Math.max(colCount, 1));

      worksheet.eachRow((row, rowNumber) => {
        if (y < margin + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const text = toSafeText(cell.value);
          const cellX = margin + (colNumber - 1) * colWidth;

          if (cellX + colWidth <= pageWidth - margin) {
            page.drawRectangle({
              x: cellX,
              y: y - lineHeight,
              width: colWidth,
              height: lineHeight,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 0.5,
              color: rowNumber === 1 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1),
            });
            page.drawText(text, {
              x: cellX + cellPadding,
              y: y - lineHeight + cellPadding,
              size: fontSize,
              font: rowNumber === 1 ? boldFont : font,
              color: rgb(0, 0, 0),
              maxWidth: colWidth - cellPadding * 2,
            });
          }
        });

        y -= lineHeight;
      });
    });

    const outName = file.name.replace(/\.[^.]+$/, "") + ".pdf";
    doc.setTitle(outName);
    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

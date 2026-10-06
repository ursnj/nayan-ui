import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";
import { extractPdfPageTexts } from "../_pdfText";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pageTexts = await extractPdfPageTexts(bytes);

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Nayan UI PDF Tools";

    const sheet = workbook.addWorksheet("PDF Content");
    sheet.columns = [
      { header: "Page", key: "page", width: 10 },
      { header: "Line", key: "line", width: 10 },
      { header: "Content", key: "content", width: 80 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    for (let i = 0; i < pageTexts.length; i++) {
      const lines = pageTexts[i].split("\n").filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        sheet.addRow({ page: i + 1, line: "", content: pageTexts[i] });
        continue;
      }
      lines.forEach((line, j) => {
        sheet.addRow({ page: i + 1, line: j + 1, content: line });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const outName = file.name.replace(/\.[^.]+$/, "") + ".xlsx";

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

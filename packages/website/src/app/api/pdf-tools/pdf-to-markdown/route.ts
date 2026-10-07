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

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const docTitle = pdfDoc.getTitle() || file.name.replace(/\.[^.]+$/, "");
    const docAuthor = pdfDoc.getAuthor();

    const lines: string[] = [];

    lines.push(`# ${docTitle}`);
    lines.push("");
    if (docAuthor) {
      lines.push(`**Author:** ${docAuthor}`);
      lines.push("");
    }
    lines.push(`**Pages:** ${totalPages}`);
    lines.push("");
    lines.push("---");
    lines.push("");

    const pageTexts = await extractPdfPageTexts(bytes);

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const rotation = page.getRotation().angle;

      lines.push(`## Page ${i + 1}`);
      lines.push("");
      lines.push(`- **Dimensions:** ${Math.round(width)} × ${Math.round(height)} pt`);
      if (rotation !== 0) {
        lines.push(`- **Rotation:** ${rotation}°`);
      }
      lines.push("");
      // Two trailing spaces force a markdown hard line break between
      // extracted lines so the original line structure survives rendering.
      lines.push(pageTexts[i].split("\n").join("  \n"));
      lines.push("");

      if (i < totalPages - 1) {
        lines.push("---");
        lines.push("");
      }
    }

    const markdown = lines.join("\n");

    return NextResponse.json({ markdown });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

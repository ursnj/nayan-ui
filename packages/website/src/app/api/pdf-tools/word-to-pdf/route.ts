import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Word file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const buffer = Buffer.from(await file.arrayBuffer());
    let textContent = "";

    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const xmlFile = zip.file("word/document.xml");
      if (xmlFile) {
        const xml = await xmlFile.async("text");
        const rawText = xml.replace(/<w:p[\s>][^]*?<\/w:p>/g, (pBlock) => {
          const texts = pBlock.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
          return texts.map((t) => t.replace(/<[^>]+>/g, "")).join("") + "\n";
        });
        textContent = rawText.trim();
      }
    } catch {
      textContent = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }

    if (!textContent.trim()) {
      textContent = "(No readable text content found in the document)";
    }

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const lineHeight = 14;
    const maxWidth = pageWidth - margin * 2;
    const charsPerLine = Math.floor(maxWidth / (font.widthOfTextAtSize("M", fontSize)));

    const wrappedLines: string[] = [];
    for (const paragraph of textContent.split("\n")) {
      if (paragraph.trim() === "") {
        wrappedLines.push("");
        continue;
      }
      const words = paragraph.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (test.length > charsPerLine) {
          if (currentLine) wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) wrappedLines.push(currentLine);
    }

    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of wrappedLines) {
      if (y < margin + lineHeight) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      if (line === "") {
        y -= lineHeight;
        continue;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0), maxWidth });
      y -= lineHeight;
    }

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

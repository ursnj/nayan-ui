import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const htmlContent = formData.get("html") as string | null;
    const title = (formData.get("title") as string) || "Document";
    const pageSize = (formData.get("pageSize") as string) || "a4";

    if (!htmlContent || htmlContent.trim().length === 0) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    const dimensions: Record<string, { width: number; height: number }> = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
      legal: { width: 612, height: 1008 },
    };

    const { width, height } = dimensions[pageSize] || dimensions.a4;
    const margin = 50;
    const lineHeight = 14;
    const maxWidth = width - margin * 2;

    const stripped = htmlContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, "\n")
      .replace(/[^\x00-\xFF]/g, "?") // Standard fonts only encode WinAnsi (Latin-1); anything else throws at draw time
      .trim();

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;

    const lines: string[] = [];
    for (const paragraph of stripped.split("\n")) {
      if (paragraph.trim() === "") {
        lines.push("");
        continue;
      }
      const words = paragraph.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    let page = doc.addPage([width, height]);
    let y = height - margin;

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = doc.addPage([width, height]);
        y = height - margin;
      }
      if (line === "") {
        y -= lineHeight;
        continue;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth,
      });
      y -= lineHeight;
    }

    doc.setTitle(title);
    doc.setCreator("Nayan UI PDF Tools");

    const result = await doc.save();
    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

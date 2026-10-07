import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const markdownContent = formData.get("markdown") as string | null;
    const title = (formData.get("title") as string) || "Document";
    const pageSize = (formData.get("pageSize") as string) || "a4";

    if (!markdownContent || markdownContent.trim().length === 0) {
      return NextResponse.json({ error: "Markdown content is required" }, { status: 400 });
    }

    const dimensions: Record<string, { width: number; height: number }> = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
      legal: { width: 612, height: 1008 },
    };

    const { width, height } = dimensions[pageSize] || dimensions.a4;
    const margin = 50;
    const bodyFontSize = 11;
    const h1FontSize = 22;
    const h2FontSize = 18;
    const h3FontSize = 14;
    const lineHeight = 16;
    const headingSpacing = 8;
    const maxWidth = width - margin * 2;

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const charsPerLine = Math.floor(maxWidth / font.widthOfTextAtSize("M", bodyFontSize));
    const charsPerLineFor = (size: number) => Math.floor(maxWidth / boldFont.widthOfTextAtSize("M", size));

    const wrapText = (text: string, maxChars: number): string[] => {
      if (text.length <= maxChars) return [text];
      const result: string[] = [];
      const words = text.split(/\s+/);
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (test.length > maxChars) {
          if (current) result.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) result.push(current);
      return result;
    };

    type LineItem = {
      text: string;
      fontSize: number;
      font: typeof font;
      spacingBefore: number;
    };

    const items: LineItem[] = [];

    const mdLines = markdownContent.split("\n");
    for (const raw of mdLines) {
      const line = raw.replace(/\r$/, "");

      if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
        const level = line.startsWith("### ") ? 3 : line.startsWith("## ") ? 2 : 1;
        const headingFontSize = level === 3 ? h3FontSize : level === 2 ? h2FontSize : h1FontSize;
        const headingText = line.slice(level + 1);
        wrapText(headingText, charsPerLineFor(headingFontSize)).forEach((w, idx) => {
          items.push({ text: w, fontSize: headingFontSize, font: boldFont, spacingBefore: idx === 0 ? headingSpacing : 0 });
        });
      } else if (line === "---" || line === "***" || line === "___") {
        items.push({ text: "————————————————————————————", fontSize: bodyFontSize, font, spacingBefore: 4 });
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        const stripped = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
        const wrapped = wrapText("• " + stripped.slice(2), charsPerLine);
        for (const w of wrapped) {
          items.push({ text: w, fontSize: bodyFontSize, font, spacingBefore: 0 });
        }
      } else if (/^\d+\. /.test(line)) {
        const stripped = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
        const wrapped = wrapText(stripped, charsPerLine);
        for (const w of wrapped) {
          items.push({ text: w, fontSize: bodyFontSize, font, spacingBefore: 0 });
        }
      } else if (line.startsWith("> ")) {
        const stripped = line.slice(2).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
        const wrapped = wrapText("| " + stripped, charsPerLine);
        for (const w of wrapped) {
          items.push({ text: w, fontSize: bodyFontSize, font, spacingBefore: 0 });
        }
      } else if (line.trim() === "") {
        items.push({ text: "", fontSize: bodyFontSize, font, spacingBefore: 0 });
      } else {
        const stripped = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/~~(.+?)~~/g, "$1").replace(/`(.+?)`/g, "$1").replace(/\[(.+?)\]\(.+?\)/g, "$1");
        const wrapped = wrapText(stripped, charsPerLine);
        for (const w of wrapped) {
          items.push({ text: w, fontSize: bodyFontSize, font, spacingBefore: 0 });
        }
      }
    }

    let page = doc.addPage([width, height]);
    let y = height - margin;

    for (const item of items) {
      const requiredHeight = item.fontSize + item.spacingBefore + 2;
      if (y < margin + requiredHeight) {
        page = doc.addPage([width, height]);
        y = height - margin;
      }

      y -= item.spacingBefore;

      if (item.text === "") {
        y -= lineHeight;
        continue;
      }

      try {
        page.drawText(item.text, {
          x: margin,
          y,
          size: item.fontSize,
          font: item.font,
          color: rgb(0, 0, 0),
          maxWidth,
        });
      } catch {
        // Standard fonts can only encode WinAnsi; fall back to a sanitized
        // version instead of failing the whole conversion over one character.
        page.drawText(item.text.replace(/[^\x00-\xFF]/g, "?"), {
          x: margin,
          y,
          size: item.fontSize,
          font: item.font,
          color: rgb(0, 0, 0),
          maxWidth,
        });
      }
      y -= item.fontSize + 4;
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

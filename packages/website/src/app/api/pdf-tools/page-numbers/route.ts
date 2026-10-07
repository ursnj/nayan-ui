import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const format = (formData.get("format") as string) || "Page {current} of {total}";
    const position = (formData.get("position") as string) || "bottom-center";
    const fontSizeParam = Math.min(72, Math.max(6, Number(formData.get("fontSize")) || 12));
    const startFrom = Math.max(1, Math.trunc(Number(formData.get("startFrom")) || 1));

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const current = i + startFrom;
      const label = format
        .replace("{current}", String(current))
        .replace("{total}", String(total + startFrom - 1));

      const textWidth = font.widthOfTextAtSize(label, fontSizeParam);
      let x: number;
      let y: number;

      if (position.startsWith("top")) {
        y = height - 30;
      } else {
        y = 20;
      }

      if (position.endsWith("left")) {
        x = 30;
      } else if (position.endsWith("right")) {
        x = width - textWidth - 30;
      } else {
        x = (width - textWidth) / 2;
      }

      page.drawText(label, {
        x,
        y,
        size: fontSizeParam,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="numbered.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Page numbering failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

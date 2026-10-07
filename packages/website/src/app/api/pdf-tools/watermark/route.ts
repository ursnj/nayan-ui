import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = (formData.get("text") as string) || "WATERMARK";
    const rawFontSize = Number(formData.get("fontSize"));
    // Clamp to a sane range: an unvalidated fontSize <= 0 makes the tile
    // layout loops below (`spacingY = fontSizeParam + 80`, etc.) step
    // backwards forever and hang the request.
    const fontSizeParam = Math.min(500, Math.max(6, Number.isFinite(rawFontSize) ? rawFontSize : 50));
    const rawOpacity = Number(formData.get("opacity"));
    const opacityParam = Math.min(1, Math.max(0.05, (Number.isFinite(rawOpacity) ? rawOpacity : 30) / 100));
    const rotation = Number(formData.get("rotation") || -45);
    const position = (formData.get("position") as string) || "center";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const rawColor = ((formData.get("color") as string) || "#888888").replace("#", "");
    // Expand shorthand #rgb to #rrggbb so each channel is read from 2 hex digits.
    const hex = rawColor.length === 3 ? rawColor.split("").map((c) => c + c).join("") : rawColor;
    const parseChannel = (slice: string) => {
      const n = parseInt(slice, 16);
      return Number.isFinite(n) ? n / 255 : 0.53; // fall back to the default gray channel
    };
    const r = parseChannel(hex.substring(0, 2));
    const g = parseChannel(hex.substring(2, 4));
    const b = parseChannel(hex.substring(4, 6));

    const { PDFDocument, rgb, StandardFonts, degrees } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    const pages = doc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSizeParam);

      if (position === "tile") {
        const spacingX = textWidth + 80;
        const spacingY = fontSizeParam + 80;
        for (let y = 0; y < height + spacingY; y += spacingY) {
          for (let x = -textWidth; x < width + textWidth; x += spacingX) {
            page.drawText(text, {
              x,
              y,
              size: fontSizeParam,
              font,
              color: rgb(r, g, b),
              opacity: opacityParam,
              rotate: degrees(rotation),
            });
          }
        }
      } else {
        let x: number;
        let y: number;
        if (position === "bottom-right") {
          x = width - textWidth - 30;
          y = 30;
        } else if (position === "bottom-left") {
          x = 30;
          y = 30;
        } else if (position === "top-left") {
          x = 30;
          y = height - fontSizeParam - 30;
        } else if (position === "top-right") {
          x = width - textWidth - 30;
          y = height - fontSizeParam - 30;
        } else {
          // center
          x = (width - textWidth) / 2;
          y = height / 2;
        }
        page.drawText(text, {
          x,
          y,
          size: fontSizeParam,
          font,
          color: rgb(r, g, b),
          opacity: opacityParam,
          rotate: position === "center" ? degrees(rotation) : degrees(0),
        });
      }
    }

    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="watermarked.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Watermark failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

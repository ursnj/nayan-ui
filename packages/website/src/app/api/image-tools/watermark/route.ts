import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = (formData.get("text") as string) || "Watermark";
    const fontSize = Number(formData.get("fontSize") || 48);
    const opacity = Number(formData.get("opacity") || 30) / 100;
    const position = (formData.get("position") as string) || "center";
    const color = (formData.get("color") as string) || "#ffffff";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const imgW = meta.width || 800;
    const imgH = meta.height || 600;

    // Parse hex color to RGB
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 255;
    const g = parseInt(hex.substring(2, 4), 16) || 255;
    const b = parseInt(hex.substring(4, 6), 16) || 255;

    let svgTexts = "";

    if (position === "tile") {
      const cols = Math.ceil(imgW / (fontSize * text.length * 0.7 + 60));
      const rows = Math.ceil(imgH / (fontSize + 40));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * (fontSize * text.length * 0.7 + 60);
          const y = row * (fontSize + 40) + fontSize;
          svgTexts += `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="bold" font-family="sans-serif" fill="rgb(${r},${g},${b})" opacity="${opacity}">${escapeXml(text)}</text>`;
        }
      }
    } else {
      let x: number;
      let y: number;
      let anchor = "middle";
      if (position === "center") {
        x = imgW / 2;
        y = imgH / 2;
      } else if (position === "bottom-right") {
        x = imgW - 30;
        y = imgH - 30;
        anchor = "end";
      } else {
        x = 30;
        y = imgH - 30;
        anchor = "start";
      }
      svgTexts = `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="bold" font-family="sans-serif" fill="rgb(${r},${g},${b})" opacity="${opacity}" text-anchor="${anchor}">${escapeXml(text)}</text>`;
    }

    const svgOverlay = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">${svgTexts}</svg>`,
    );

    const result = await sharp(buffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="watermarked.png"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Watermark failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

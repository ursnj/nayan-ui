import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

const SUPPORTED_FORMATS: Record<string, { mime: string; ext: string }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  gif: { mime: "image/gif", ext: "gif" },
  tiff: { mime: "image/tiff", ext: "tiff" },
  avif: { mime: "image/avif", ext: "avif" },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const format = (formData.get("format") as string) || "png";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const fmt = SUPPORTED_FORMATS[format];
    if (!fmt) {
      return NextResponse.json(
        { error: `Unsupported format. Use: ${Object.keys(SUPPORTED_FORMATS).join(", ")}` },
        { status: 400 },
      );
    }

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await sharp(buffer)
      .toFormat(format as keyof import("sharp").FormatEnum, { quality: 92 })
      .toBuffer();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": fmt.mime,
        "Content-Disposition": `attachment; filename="converted.${fmt.ext}"`,
        "X-Format": format,
        "X-Size": String(result.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

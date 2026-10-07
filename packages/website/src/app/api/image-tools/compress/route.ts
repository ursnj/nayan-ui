import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const quality = Number(formData.get("quality") || 80);

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(buffer);
    const meta = await pipeline.metadata();
    const hasAlpha = meta.hasAlpha ?? false;
    const q = Math.min(100, Math.max(1, quality));

    let result: Buffer;
    let contentType: string;
    let ext: string;

    if (hasAlpha) {
      result = await sharp(buffer).webp({ quality: q }).toBuffer();
      contentType = "image/webp";
      ext = "webp";
    } else {
      result = await sharp(buffer).jpeg({ quality: q }).toBuffer();
      contentType = "image/jpeg";
      ext = "jpg";
    }

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="compressed.${ext}"`,
        "X-Original-Size": String(buffer.length),
        "X-Compressed-Size": String(result.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Compression failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

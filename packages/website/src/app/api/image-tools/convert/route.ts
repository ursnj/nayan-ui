import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  checkImage,
  guardTool,
  imageInput,
  loadSharp,
  validateFileSize,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["image-tools/convert"];

const SUPPORTED_FORMATS: Record<string, { mime: string; ext: string }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  gif: { mime: "image/gif", ext: "gif" },
  tiff: { mime: "image/tiff", ext: "tiff" },
  avif: { mime: "image/avif", ext: "avif" },
};

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const format = (formData.get("format") as string) || "png";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const fmt = SUPPORTED_FORMATS[format];
    if (!fmt) {
      return NextResponse.json(
        { error: `Unsupported format. Use: ${Object.keys(SUPPORTED_FORMATS).join(", ")}` },
        { status: 400 },
      );
    }

    const sharp = await loadSharp();
    const buffer = Buffer.from(await file.arrayBuffer());
    await checkImage(buffer, LIMIT);
    const result = await sharp(buffer, imageInput(LIMIT))
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
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("image-tools/convert", handle);

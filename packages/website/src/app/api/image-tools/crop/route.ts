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

const LIMIT = TOOL_LIMITS["image-tools/crop"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const left = Number(formData.get("left") || 0);
    const top = Number(formData.get("top") || 0);
    const width = Number(formData.get("width") || 0);
    const height = Number(formData.get("height") || 0);

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;
    if (!width || !height) {
      return NextResponse.json({ error: "Width and height are required" }, { status: 400 });
    }

    const sharp = await loadSharp();
    const buffer = Buffer.from(await file.arrayBuffer());
    await checkImage(buffer, LIMIT);
    const result = await sharp(buffer, imageInput(LIMIT))
      .extract({ left, top, width, height })
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="cropped.png"`,
        "X-Width": String(width),
        "X-Height": String(height),
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Crop failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("image-tools/crop", handle);

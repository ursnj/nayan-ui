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

const LIMIT = TOOL_LIMITS["image-tools/rotate"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rotation = Number(formData.get("rotation") || 0);
    const flipH = formData.get("flipH") === "true";
    const flipV = formData.get("flipV") === "true";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const sharp = await loadSharp();
    const buffer = Buffer.from(await file.arrayBuffer());
    await checkImage(buffer, LIMIT);
    let pipeline = sharp(buffer, imageInput(LIMIT));

    if (rotation) {
      pipeline = pipeline.rotate(rotation);
    }
    if (flipH) {
      pipeline = pipeline.flop();
    }
    if (flipV) {
      pipeline = pipeline.flip();
    }

    const result = await pipeline.png().toBuffer();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="rotated.png"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Rotate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("image-tools/rotate", handle);

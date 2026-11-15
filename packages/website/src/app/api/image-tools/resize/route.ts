import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  checkImage,
  checkOutputSize,
  guardTool,
  imageInput,
  loadSharp,
  validateFileSize,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["image-tools/resize"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const width = Number(formData.get("width") || 0);
    const height = Number(formData.get("height") || 0);
    const fit = (formData.get("fit") as string) || "inside";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;
    if (!width && !height) {
      return NextResponse.json({ error: "Width or height is required" }, { status: 400 });
    }
    if (![width, height].every((side) => Number.isInteger(side) && side >= 0)) {
      return NextResponse.json(
        { error: "Width and height must be whole numbers" },
        { status: 400 },
      );
    }

    const sharp = await loadSharp();
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await checkImage(buffer, LIMIT);
    // The size sharp will produce: both sides for cover/fill/contain, else the image scaled to
    // fit inside (or cover, for "outside") the requested box.
    let outWidth = width;
    let outHeight = height;
    if (!width || !height || fit === "inside" || fit === "outside") {
      const scales = [width / image.width, height / image.height].filter((scale) => scale > 0);
      const scale = fit === "outside" ? Math.max(...scales) : Math.min(...scales);
      outWidth = image.width * scale;
      outHeight = image.height * scale;
    }
    checkOutputSize(outWidth, outHeight, LIMIT);
    const result = await sharp(buffer, imageInput(LIMIT))
      .resize({
        width: width || undefined,
        height: height || undefined,
        fit: fit as keyof import("sharp").FitEnum,
        withoutEnlargement: false,
      })
      .png()
      .toBuffer({ resolveWithObject: true });

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="resized.png"`,
        "X-Width": String(result.info.width),
        "X-Height": String(result.info.height),
        "X-Size": String(result.data.length),
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Resize failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("image-tools/resize", handle);

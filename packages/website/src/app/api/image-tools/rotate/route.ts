import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rotation = Number(formData.get("rotation") || 0);
    const flipH = formData.get("flipH") === "true";
    const flipV = formData.get("flipV") === "true";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer);

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
    const message = err instanceof Error ? err.message : "Rotate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

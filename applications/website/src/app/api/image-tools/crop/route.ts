import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
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
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    if (!width || !height) {
      return NextResponse.json({ error: "Width and height are required" }, { status: 400 });
    }

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await sharp(buffer)
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
    const message = err instanceof Error ? err.message : "Crop failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

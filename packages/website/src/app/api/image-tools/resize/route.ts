import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const width = Number(formData.get("width") || 0);
    const height = Number(formData.get("height") || 0);
    const fit = (formData.get("fit") as string) || "inside";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    if (!width && !height) {
      return NextResponse.json({ error: "Width or height is required" }, { status: 400 });
    }

    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await sharp(buffer)
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
    const message = err instanceof Error ? err.message : "Resize failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

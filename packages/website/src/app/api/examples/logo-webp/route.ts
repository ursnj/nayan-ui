import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form.getAll("frames");
    const fps = Number(form.get("fps"));
    if (files.length < 2 || files.length > 120 || !Number.isInteger(fps) || fps < 10 || fps > 30)
      return NextResponse.json({ error: "Provide 2–120 frames at 10–30 fps." }, { status: 400 });
    if (
      files.some((file) => !(file instanceof File)) ||
      files.reduce((total, file) => total + (file as File).size, 0) > 16 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Animation frames must be files totaling at most 16 MB." },
        { status: 400 },
      );

    let width = 0;
    let height = 0;
    const frames: Buffer[] = [];
    for (const file of files as File[]) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const image = sharp(buffer, { limitInputPixels: 640 * 360 });
      const metadata = await image.metadata();
      if (
        metadata.format !== "png" ||
        !metadata.width ||
        !metadata.height ||
        metadata.width > 640 ||
        metadata.height > 360 ||
        (metadata.pages ?? 1) !== 1
      )
        return NextResponse.json(
          { error: "Use PNG frames no larger than 640 × 360." },
          { status: 400 },
        );
      width ||= metadata.width;
      height ||= metadata.height;
      if (width !== metadata.width || height !== metadata.height)
        return NextResponse.json(
          { error: "Every frame must have the same dimensions." },
          { status: 400 },
        );
      frames.push(await image.ensureAlpha().raw().toBuffer());
    }
    const delay = frames.map(
      (_, index) => Math.round(((index + 1) * 1000) / fps) - Math.round((index * 1000) / fps),
    );
    const pixels = Buffer.concat(frames);
    frames.length = 0;
    const webp = await sharp(pixels, {
      raw: { width, height: height * files.length, channels: 4, pageHeight: height },
    })
      .webp({ lossless: true, loop: 0, delay, effort: 3 })
      .toBuffer();
    return new NextResponse(new Uint8Array(webp), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": 'attachment; filename="logo-animation.webp"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The animation could not be encoded. Please try exporting again." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

const SIZES = [16, 32, 48, 180, 192, 512];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const appName = ((formData.get("name") as string) || "My App").trim() || "My App";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const sharp = (await import("sharp")).default;
    const JSZip = (await import("jszip")).default;
    const buffer = Buffer.from(await file.arrayBuffer());

    const zip = new JSZip();
    for (const size of SIZES) {
      const png = await sharp(buffer)
        .resize(size, size, { fit: "cover" })
        .png()
        .toBuffer();
      zip.file(`favicon-${size}x${size}.png`, png);
    }

    const manifest = {
      name: appName,
      short_name: appName,
      icons: [
        { src: "favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "favicon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    };
    zip.file("site.webmanifest", JSON.stringify(manifest, null, 2));

    const markup = [
      '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
      '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
      '<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">',
      '<link rel="manifest" href="/site.webmanifest">',
    ].join("\n");
    zip.file("favicon-markup.txt", markup);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="favicons.zip"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Favicon generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

function resolveObj(page: any, objId: string): Promise<any> {
  return new Promise((resolve) => page.objs.get(objId, resolve));
}

// pdf.js decodes an embedded raster image into one of these pixel layouts
// (GRAYSCALE_1BPP packs 8 pixels per byte; the others are already byte-aligned).
function toRgba(imgData: { data: Uint8Array | Uint8ClampedArray; width: number; height: number; kind: number }, ImageKind: Record<string, number>) {
  const { data, width, height, kind } = imgData;
  const rgba = new Uint8ClampedArray(width * height * 4);

  if (kind === ImageKind.RGBA_32BPP) {
    rgba.set(data);
  } else if (kind === ImageKind.RGB_24BPP) {
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (kind === ImageKind.GRAYSCALE_1BPP) {
    const bytesPerRow = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const byte = data[y * bytesPerRow + (x >> 3)];
        const bit = (byte >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0;
        const j = (y * width + x) * 4;
        rgba[j] = v;
        rgba[j + 1] = v;
        rgba[j + 2] = v;
        rgba[j + 3] = 255;
      }
    }
  } else {
    return null;
  }
  return rgba;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("@napi-rs/canvas");

    const loadingTask = pdfjs.getDocument({
      data: bytes.slice(0),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: false,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;

    const images: { pageNumber: number; buffer: Buffer; index: number }[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        try {
          const opList = await page.getOperatorList();
          const seen = new Set<string>();
          let indexOnPage = 0;

          for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            if (fn !== pdfjs.OPS.paintImageXObject && fn !== pdfjs.OPS.paintImageXObjectRepeat) continue;
            const objId = opList.argsArray[i][0];
            if (typeof objId !== "string" || seen.has(objId)) continue;
            seen.add(objId);

            const imgData = await resolveObj(page, objId);
            if (!imgData || !imgData.width || !imgData.height) continue;

            const rgba = toRgba(imgData, pdfjs.ImageKind);
            if (!rgba) continue; // Unsupported pixel format — skip rather than emit a corrupt image.

            const canvas = createCanvas(imgData.width, imgData.height);
            const ctx = canvas.getContext("2d");
            const imageData = ctx.createImageData(imgData.width, imgData.height);
            imageData.data.set(rgba);
            ctx.putImageData(imageData, 0, 0);
            const buffer = await canvas.encode("png");

            images.push({ pageNumber, buffer, index: ++indexOnPage });
          }
        } finally {
          await page.cleanup();
        }
      }
    } finally {
      await pdf.destroy();
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No embedded raster images were found in this PDF (it may only contain text or vector graphics)." },
        { status: 404 },
      );
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const img of images) {
      zip.file(`page-${img.pageNumber}-image-${img.index}.png`, img.buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const outName = file.name.replace(/\.[^.]+$/, "") + "-images.zip";

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "X-Image-Count": String(images.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

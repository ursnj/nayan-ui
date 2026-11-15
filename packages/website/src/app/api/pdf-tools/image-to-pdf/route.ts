import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  checkImage,
  guardTool,
  imageInput,
  loadSharp,
  validateFileSizes,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/image-to-pdf"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const orientation = (formData.get("orientation") as string) || "portrait";
    const fitMode = (formData.get("fit") as string) || "contain";

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }
    const sizeError = validateFileSizes(files, LIMIT);
    if (sizeError) return sizeError;

    const { PDFDocument } = await import("pdf-lib");
    const sharp = await loadSharp();
    const doc = await PDFDocument.create();
    const pageWidth = orientation === "landscape" ? 841.89 : 595.28; // A4
    const pageHeight = orientation === "landscape" ? 595.28 : 841.89;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await checkImage(buffer, LIMIT, `"${file.name}"`);
      // Convert to PNG for consistent embedding
      const pngBuffer = await sharp(buffer, imageInput(LIMIT)).png().toBuffer();
      const image = await doc.embedPng(pngBuffer);

      const page = doc.addPage([pageWidth, pageHeight]);
      const imgDims = image.scale(1);

      let drawWidth: number;
      let drawHeight: number;

      if (fitMode === "fill") {
        drawWidth = pageWidth;
        drawHeight = pageHeight;
      } else {
        // contain: fit within page margins
        const margin = 40;
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;
        const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height);
        drawWidth = imgDims.width * scale;
        drawHeight = imgDims.height * scale;
      }

      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
    }

    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="images.pdf"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Image to PDF conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/image-to-pdf", handle);

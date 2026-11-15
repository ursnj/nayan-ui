import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSize,
  validatePageCount,
} from "../../helpers";
import { renderPdfPageToImage } from "../_pdfText";

const LIMIT = TOOL_LIMITS["pdf-tools/pdf-to-image"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const formatParam = (formData.get("format") as string) || "png";
    const format: "png" | "jpeg" = formatParam === "jpeg" ? "jpeg" : "png";
    const dpi = Number(formData.get("dpi") || 150);
    const pageParam = formData.get("page");

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const bytes = new Uint8Array(await file.arrayBuffer());

    // A `page` field means "render this one page and return image bytes".
    // No `page` field means "analyze" mode: just list page dimensions so the
    // frontend can show a picker before committing to rendering every page.
    if (pageParam !== null) {
      const pageNumber = Number(pageParam);
      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return NextResponse.json({ error: "A valid page number is required" }, { status: 400 });
      }
      // At most 200 DPI: memory grows with its square (an A4 page at 600 DPI is ~140 MB).
      const safeDpi = Math.min(200, Math.max(36, Number.isFinite(dpi) ? dpi : 150));

      let image: Buffer;
      try {
        image = await renderPdfPageToImage(bytes, pageNumber, {
          dpi: safeDpi,
          format,
          maxPixels: LIMIT.maxPixels,
        });
      } catch (err) {
        if (err instanceof ToolLimitError) return err.response();
        const message = err instanceof Error ? err.message : "Failed to render page";
        return NextResponse.json({ error: message }, { status: 422 });
      }

      return new NextResponse(new Uint8Array(image), {
        status: 200,
        headers: {
          "Content-Type": format === "jpeg" ? "image/jpeg" : "image/png",
          "Content-Disposition": `attachment; filename="page-${pageNumber}.${format === "jpeg" ? "jpg" : "png"}"`,
        },
      });
    }

    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageError = validatePageCount(doc.getPageCount(), LIMIT.maxPages);
    if (pageError) return pageError;
    const total = doc.getPageCount();

    const pages: { width: number; height: number; index: number }[] = [];
    for (let i = 0; i < total; i++) {
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      pages.push({ width: Math.round(width), height: Math.round(height), index: i + 1 });
    }

    return NextResponse.json({
      pages,
      total,
      format,
      dpi,
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "PDF to image conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/pdf-to-image", handle);

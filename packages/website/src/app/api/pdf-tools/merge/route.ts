import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSizes,
  validatePageCount,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/merge"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length < 2) {
      return NextResponse.json({ error: "At least 2 PDF files are required" }, { status: 400 });
    }
    const sizeError = validateFileSizes(files, LIMIT);
    if (sizeError) return sizeError;

    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();

    let totalPages = 0;
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      totalPages += doc.getPageCount();
      const pageError = validatePageCount(totalPages, LIMIT.maxPages);
      if (pageError) return pageError;
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }

    const result = await merged.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="merged.pdf"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Merge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/merge", handle);

import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSize,
  validatePageCount,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/compress"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const originalSize = bytes.length;

    // Load and re-save to strip unused objects, compress streams
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageError = validatePageCount(doc.getPageCount(), LIMIT.maxPages);
    if (pageError) return pageError;

    // Remove metadata to reduce size
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");

    const result = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed.pdf"`,
        "X-Original-Size": String(originalSize),
        "X-Compressed-Size": String(result.length),
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Compression failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/compress", handle);

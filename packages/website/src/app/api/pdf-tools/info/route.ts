import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSize,
  validatePageCount,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/info"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageError = validatePageCount(doc.getPageCount(), LIMIT.maxPages);
    if (pageError) return pageError;
    const pageCount = doc.getPageCount();

    return NextResponse.json({ pageCount });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Failed to read PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/info", handle);

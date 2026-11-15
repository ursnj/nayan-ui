import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSize,
  validatePageCount,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/organize"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pageOrder = formData.get("pageOrder") as string | null;
    const deletedPages = formData.get("deletedPages") as string | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageError = validatePageCount(srcDoc.getPageCount(), LIMIT.maxPages);
    if (pageError) return pageError;
    const totalPages = srcDoc.getPageCount();

    let deleted: number[] = [];
    if (deletedPages) {
      deleted = JSON.parse(deletedPages) as number[];
    }

    let order: number[] = [];
    if (pageOrder) {
      order = JSON.parse(pageOrder) as number[];
    } else {
      order = Array.from({ length: totalPages }, (_, i) => i);
    }

    order = order.filter((i) => !deleted.includes(i) && i >= 0 && i < totalPages);

    if (order.length === 0) {
      return NextResponse.json({ error: "At least one page must remain" }, { status: 400 });
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, order);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const result = await newDoc.save();
    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="organized-${file.name}"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Organization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/organize", handle);

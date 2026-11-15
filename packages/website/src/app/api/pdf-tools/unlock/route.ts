import { NextRequest, NextResponse } from "next/server";
import {
  TOOL_LIMITS,
  ToolLimitError,
  guardTool,
  validateFileSize,
  validatePageCount,
} from "../../helpers";

const LIMIT = TOOL_LIMITS["pdf-tools/unlock"];

async function handle(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file, LIMIT.fileBytes);
    if (sizeError) return sizeError;
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const pdfLib = await import("pdf-lib");
    const { configure, unlockInPlace } = await import("pdf-lib-encrypt");
    configure(pdfLib);

    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
      doc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: true });
      const pageError = validatePageCount(doc.getPageCount(), LIMIT.maxPages);
      if (pageError) return pageError;
    } catch {
      return NextResponse.json({ error: "The file is not a valid PDF" }, { status: 422 });
    }

    // Decrypt — throws if the password is wrong
    const wasEncrypted = await unlockInPlace(doc, password);

    if (!wasEncrypted) {
      return NextResponse.json({ error: "This PDF is not encrypted" }, { status: 400 });
    }

    // Save without encryption
    const result = await doc.save({ useObjectStreams: false });

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="unlocked.pdf"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ToolLimitError) return err.response();
    const message = err instanceof Error ? err.message : "Unlock failed";
    // Wrong password or unsupported encryption
    if (message.includes("password") || message.includes("Password")) {
      return NextResponse.json({ error: "Wrong password" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = guardTool("pdf-tools/unlock", handle);

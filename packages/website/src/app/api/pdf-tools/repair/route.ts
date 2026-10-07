import { NextRequest, NextResponse } from "next/server";
import type { PDFDocument as PDFDocumentType } from "pdf-lib";
import { validateFileSize } from "../../helpers";

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

    const { PDFDocument } = await import("pdf-lib");
    let doc: PDFDocumentType;
    try {
      doc = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
    } catch {
      return NextResponse.json(
        { error: "The file is too corrupted to repair. The PDF structure cannot be parsed." },
        { status: 422 }
      );
    }

    const newDoc = await PDFDocument.create();
    const pageCount = doc.getPageCount();

    if (pageCount === 0) {
      return NextResponse.json({ error: "The PDF contains no pages" }, { status: 422 });
    }

    const indices = Array.from({ length: pageCount }, (_, i) => i);
    const copiedPages = await newDoc.copyPages(doc, indices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const result = await newDoc.save({ useObjectStreams: false });
    // Content-Disposition header values must be ISO-8859-1; a file name with
    // non-Latin1 characters (e.g. CJK, emoji) would otherwise throw here and
    // turn a successful repair into a 500. Keep a sanitized ASCII fallback
    // and carry the real name via the UTF-8 filename* parameter.
    const asciiName = `repaired-${file.name}`.replace(/[^\x20-\x7E]/g, "_");
    const utf8Name = encodeURIComponent(`repaired-${file.name}`);
    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
        "X-Page-Count": String(pageCount),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Repair failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

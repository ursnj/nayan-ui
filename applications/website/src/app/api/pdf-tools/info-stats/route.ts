import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";
import { extractPdfPageTexts } from "../_pdfText";

function detectPdfVersion(bytes: Uint8Array): string | null {
  // The PDF version is declared in the literal header of the first ~16 bytes,
  // e.g. "%PDF-1.7" — pdf-lib doesn't expose this itself, so read it directly.
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 16));
  const match = header.match(/%PDF-(\d\.\d)/);
  return match ? match[1] : null;
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

    const { PDFDocument } = await import("pdf-lib");
    let doc;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "The file is not a valid PDF" }, { status: 422 });
    }

    const pages = doc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage ? firstPage.getSize() : { width: 0, height: 0 };
    const allSameSize = pages.every((p) => {
      const s = p.getSize();
      return Math.round(s.width) === Math.round(width) && Math.round(s.height) === Math.round(height);
    });

    // Word count requires real text extraction (slower than a pure metadata
    // read) — that tradeoff is disclosed to the user rather than faked.
    let wordCount = 0;
    try {
      const pageTexts = await extractPdfPageTexts(bytes);
      // The "No extractable text on this page..." fallback sentence would
      // otherwise pollute the word count on scanned pages — strip it first.
      wordCount = pageTexts
        .filter((t) => !t.startsWith("No extractable text"))
        .join(" ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    } catch {
      wordCount = 0;
    }

    return NextResponse.json({
      pageCount: pages.length,
      fileSize: file.size,
      pdfVersion: detectPdfVersion(bytes),
      pageWidth: Math.round(width),
      pageHeight: Math.round(height),
      mixedPageSizes: !allSameSize,
      encrypted: doc.isEncrypted,
      title: doc.getTitle() || null,
      author: doc.getAuthor() || null,
      producer: doc.getProducer() || null,
      wordCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read PDF info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

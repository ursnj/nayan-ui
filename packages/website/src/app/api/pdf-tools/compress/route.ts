import { NextRequest, NextResponse } from "next/server";
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
    const originalSize = bytes.length;

    // Load and re-save to strip unused objects, compress streams
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

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
    const message = err instanceof Error ? err.message : "Compression failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

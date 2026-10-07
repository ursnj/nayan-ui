import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = (formData.get("action") as string) || "read";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "The file is not a valid PDF" }, { status: 422 });
    }

    if (action === "read") {
      return NextResponse.json({
        title: doc.getTitle() || "",
        author: doc.getAuthor() || "",
        subject: doc.getSubject() || "",
        keywords: doc.getKeywords() || "",
        creator: doc.getCreator() || "",
        producer: doc.getProducer() || "",
        creationDate: doc.getCreationDate()?.toISOString() || "",
        encrypted: doc.isEncrypted,
      });
    }

    // action === "write"
    const title = (formData.get("title") as string) || "";
    const author = (formData.get("author") as string) || "";
    const subject = (formData.get("subject") as string) || "";
    const keywords = (formData.get("keywords") as string) || "";

    doc.setTitle(title);
    doc.setAuthor(author);
    doc.setSubject(subject);
    // pdf-lib's own setKeywords() always joins with a plain space (and
    // getKeywords() returns that same space-joined string back) — splitting
    // only on commas would treat an unmodified, freshly-read keyword string
    // as one giant keyword. Accept both commas and whitespace as separators.
    doc.setKeywords(
      keywords
        .split(/[,\s]+/)
        .map((k) => k.trim())
        .filter(Boolean),
    );
    doc.setModificationDate(new Date());

    const result = await doc.save({ useObjectStreams: false });
    const outName = file.name.replace(/\.[^.]+$/, "") + "-edited.pdf";

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Metadata operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const pdfLib = await import("pdf-lib");
    const { configure, lock } = await import("pdf-lib-encrypt");
    configure(pdfLib);

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Re-serialize through pdf-lib first to normalise the document
    const doc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    const plain = await doc.save();

    // AES-256 encryption — viewer will prompt for password
    const encrypted = await lock(plain, password);

    return new NextResponse(new Uint8Array(encrypted), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="protected.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Protection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

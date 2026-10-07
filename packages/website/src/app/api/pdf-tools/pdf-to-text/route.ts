import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";
import { extractPdfPageTexts } from "../_pdfText";

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
    const pageTexts = await extractPdfPageTexts(bytes);

    const text = pageTexts
      .map((pageText, i) => `--- Page ${i + 1} ---\n\n${pageText}`)
      .join("\n\n");

    const outName = file.name.replace(/\.[^.]+$/, "") + ".txt";

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Text extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

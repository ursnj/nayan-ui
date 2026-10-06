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

    const { Document, Packer, Paragraph, TextRun, PageBreak } = await import("docx");

    const children: any[] = [];
    for (let i = 0; i < pageTexts.length; i++) {
      if (i > 0) {
        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `— Page ${i + 1} —`,
              bold: true,
              size: 28,
            }),
          ],
        })
      );
      const lines = pageTexts[i].split("\n");
      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22,
              }),
            ],
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const outName = file.name.replace(/\.[^.]+$/, "") + ".docx";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

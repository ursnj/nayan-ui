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

    const pptxgenjs = await import("pptxgenjs");
    const PptxGenJS = pptxgenjs.default || pptxgenjs;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = file.name.replace(/\.[^.]+$/, "");

    for (let i = 0; i < pageTexts.length; i++) {
      const slide = pptx.addSlide();
      slide.addText(`Page ${i + 1}`, {
        x: 0.5,
        y: 0.3,
        w: "90%",
        fontSize: 28,
        bold: true,
        color: "333333",
      });
      // Long pages won't fit one slide at a fixed size — "shrink" scales the
      // font down to fit the box instead of silently overflowing it.
      slide.addText(pageTexts[i], {
        x: 0.5,
        y: 1.2,
        w: "90%",
        h: 3.5,
        fontSize: 16,
        color: "555555",
        valign: "top",
        fit: "shrink",
      });
    }

    const arrayBuffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
    const outName = file.name.replace(/\.[^.]+$/, "") + ".pptx";

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

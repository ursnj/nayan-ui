import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PowerPoint file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const buffer = Buffer.from(await file.arrayBuffer());

    const slideTexts: string[][] = [];
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);

      let slideIndex = 1;
      while (true) {
        const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);
        if (!slideFile) break;
        const xml = await slideFile.async("text");
        const texts = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        const slideText = texts.map((t) => t.replace(/<[^>]+>/g, "")).filter(Boolean);
        slideTexts.push(slideText.length > 0 ? slideText : [`Slide ${slideIndex}`]);
        slideIndex++;
      }
    } catch {
      slideTexts.push(["(Could not parse presentation content)"]);
    }

    if (slideTexts.length === 0) {
      slideTexts.push(["(No slides found in the presentation)"]);
    }

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 960;
    const pageHeight = 540;
    const margin = 50;

    for (let i = 0; i < slideTexts.length; i++) {
      const page = doc.addPage([pageWidth, pageHeight]);

      page.drawRectangle({
        x: 0, y: 0, width: pageWidth, height: pageHeight,
        color: rgb(1, 1, 1),
      });

      page.drawText(`Slide ${i + 1}`, {
        x: margin,
        y: pageHeight - margin - 20,
        size: 24,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      let y = pageHeight - margin - 60;
      for (const text of slideTexts[i]) {
        if (y < margin) break;
        page.drawText(text.substring(0, 120), {
          x: margin,
          y,
          size: 14,
          font,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth: pageWidth - margin * 2,
        });
        y -= 22;
      }
    }

    const outName = file.name.replace(/\.[^.]+$/, "") + ".pdf";
    doc.setTitle(outName);
    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

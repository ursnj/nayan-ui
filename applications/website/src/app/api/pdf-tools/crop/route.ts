import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const top = parseFloat((formData.get("top") as string) || "0");
    const right = parseFloat((formData.get("right") as string) || "0");
    const bottom = parseFloat((formData.get("bottom") as string) || "0");
    const left = parseFloat((formData.get("left") as string) || "0");
    const applyTo = (formData.get("applyTo") as string) || "all";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;

    const margins = { top, right, bottom, left };
    for (const [name, value] of Object.entries(margins)) {
      if (!Number.isFinite(value) || value < 0 || value > 50) {
        return NextResponse.json(
          { error: `Invalid ${name} margin. Must be a number between 0 and 50.` },
          { status: 400 },
        );
      }
    }
    if (left + right >= 100) {
      return NextResponse.json({ error: "Left and right margins must add up to less than 100%." }, { status: 400 });
    }
    if (top + bottom >= 100) {
      return NextResponse.json({ error: "Top and bottom margins must add up to less than 100%." }, { status: 400 });
    }

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();

    const pageIndices: number[] = [];
    if (applyTo === "all") {
      pages.forEach((_, i) => pageIndices.push(i));
    } else {
      const idx = parseInt(applyTo, 10);
      if (idx >= 0 && idx < pages.length) pageIndices.push(idx);
    }

    for (const i of pageIndices) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const cropLeft = (left / 100) * width;
      const cropRight = (right / 100) * width;
      const cropTop = (top / 100) * height;
      const cropBottom = (bottom / 100) * height;

      page.setCropBox(cropLeft, cropBottom, width - cropLeft - cropRight, height - cropTop - cropBottom);
    }

    const result = await doc.save();
    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cropped-${file.name}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cropping failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

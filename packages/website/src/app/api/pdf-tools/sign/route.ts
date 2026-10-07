import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"] as const;
type Position = (typeof POSITIONS)[number];

function resolvePosition(
  position: Position,
  pageWidth: number,
  pageHeight: number,
  sigWidth: number,
  sigHeight: number,
  margin: number,
) {
  switch (position) {
    case "bottom-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: pageWidth - sigWidth - margin, y: pageHeight - sigHeight - margin };
    case "top-left":
      return { x: margin, y: pageHeight - sigHeight - margin };
    case "bottom-right":
    default:
      return { x: pageWidth - sigWidth - margin, y: margin };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const signatureDataUrl = formData.get("signature") as string | null;
    const pageNumberRaw = Number(formData.get("page") || 1);
    const positionRaw = (formData.get("position") as string) || "bottom-right";
    const widthPt = Math.min(400, Math.max(40, Number(formData.get("width") || 160)));

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/png")) {
      return NextResponse.json({ error: "A drawn signature is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    const position: Position = (POSITIONS as readonly string[]).includes(positionRaw)
      ? (positionRaw as Position)
      : "bottom-right";

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "The file is not a valid PDF" }, { status: 422 });
    }

    const pages = doc.getPages();
    const pageIndex = Math.min(Math.max(1, Number.isInteger(pageNumberRaw) ? pageNumberRaw : 1), pages.length) - 1;
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const sigImage = await doc.embedPng(signatureDataUrl);
    const scale = widthPt / sigImage.width;
    const sigWidth = widthPt;
    const sigHeight = sigImage.height * scale;
    const margin = 24;
    const { x, y } = resolvePosition(position, pageWidth, pageHeight, sigWidth, sigHeight, margin);

    page.drawImage(sigImage, { x, y, width: sigWidth, height: sigHeight });

    const result = await doc.save({ useObjectStreams: false });
    const outName = file.name.replace(/\.[^.]+$/, "") + "-signed.pdf";

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

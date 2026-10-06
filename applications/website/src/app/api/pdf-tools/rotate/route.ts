import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const angle = Number(formData.get("angle") || 90);
    const pageSpec = (formData.get("pages") as string) || "all";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    if (![90, 180, 270].includes(angle)) {
      return NextResponse.json({ error: "Angle must be 90, 180, or 270" }, { status: 400 });
    }

    const { PDFDocument, degrees } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = doc.getPageCount();

    let indices: number[];
    if (pageSpec === "all") {
      indices = Array.from({ length: total }, (_, i) => i);
    } else {
      indices = pageSpec
        .split(",")
        .flatMap((p) => {
          const trimmed = p.trim();
          if (trimmed.includes("-")) {
            const [s, e] = trimmed.split("-").map(Number);
            const pages: number[] = [];
            for (let i = Math.max(1, s); i <= Math.min(e, total); i++) pages.push(i - 1);
            return pages;
          }
          const n = Number(trimmed);
          return n >= 1 && n <= total ? [n - 1] : [];
        });
    }

    for (const idx of indices) {
      const page = doc.getPage(idx);
      const current = page.getRotation().angle;
      page.setRotation(degrees(current + angle));
    }

    const result = await doc.save();

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rotated.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rotation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

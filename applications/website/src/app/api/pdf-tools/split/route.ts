import { NextRequest, NextResponse } from "next/server";
import { validateFileSize } from "../../helpers";

function parseRanges(rangeStr: string, total: number): number[][] {
  return rangeStr.split(",").map((part) => {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [s, e] = trimmed.split("-").map(Number);
      if (!Number.isInteger(s) || !Number.isInteger(e)) {
        throw new Error(`Invalid page range "${trimmed}"`);
      }
      if (s > e) {
        throw new Error(`Invalid page range "${trimmed}": start page is after end page`);
      }
      if (s < 1 || e > total) {
        throw new Error(`Page range "${trimmed}" is out of bounds — this PDF has ${total} page${total === 1 ? "" : "s"}`);
      }
      const pages: number[] = [];
      for (let i = s; i <= e; i++) pages.push(i - 1);
      return pages;
    }
    const p = Number(trimmed);
    if (!Number.isInteger(p) || p < 1 || p > total) {
      throw new Error(`Page "${trimmed}" is out of bounds — this PDF has ${total} page${total === 1 ? "" : "s"}`);
    }
    return [p - 1];
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ranges = (formData.get("ranges") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    const sizeError = validateFileSize(file);
    if (sizeError) return sizeError;
    if (!ranges.trim()) {
      return NextResponse.json({ error: "Page ranges are required (e.g. 1-3,5,7-9)" }, { status: 400 });
    }

    const { PDFDocument } = await import("pdf-lib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    let groups: number[][];
    try {
      groups = parseRanges(ranges, total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid page ranges";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (groups.length === 1) {
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, groups[0]);
      pages.forEach((p) => doc.addPage(p));
      const result = await doc.save();
      return new NextResponse(new Uint8Array(result), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="split.pdf"`,
        },
      });
    }

    // Multiple ranges: return JSON with base64 PDFs
    const parts: string[] = [];
    for (const group of groups) {
      if (group.length === 0) continue;
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, group);
      pages.forEach((p) => doc.addPage(p));
      const saved = await doc.save();
      const b64 = Buffer.from(saved).toString("base64");
      parts.push(b64);
    }

    return NextResponse.json({ parts, total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Split failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

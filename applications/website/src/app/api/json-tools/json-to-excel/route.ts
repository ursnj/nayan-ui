import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body.trim()) {
      return NextResponse.json({ error: "JSON body is required" }, { status: 400 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const flat = arr.filter((r) => r && typeof r === "object" && !Array.isArray(r));
    if (flat.length === 0) {
      return NextResponse.json({ error: "JSON must be an object or array of objects" }, { status: 400 });
    }

    const keys = [...new Set(flat.flatMap(Object.keys))];

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Nayan UI JSON Tools";

    const sheet = workbook.addWorksheet("Data");
    sheet.columns = keys.map((key) => ({
      header: key,
      key,
      width: Math.max(key.length + 4, 15),
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    for (const row of flat) {
      const values: Record<string, any> = {};
      for (const key of keys) {
        const val = row[key];
        values[key] = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : val;
      }
      sheet.addRow(values);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="data.xlsx"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

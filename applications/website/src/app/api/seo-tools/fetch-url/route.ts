import { NextRequest, NextResponse } from "next/server";
import { BlockedUrlError, safeFetch } from "../_ssrf-guard";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;

    const res = await safeFetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NayanUI/1.0; +https://nayanui.com)",
        Accept: "text/xml, application/xml, text/plain, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${res.status} ${res.statusText}` },
        { status: 422 },
      );
    }

    const content = await res.text();
    return NextResponse.json({ content });
  } catch (err: any) {
    if (err instanceof BlockedUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }
    return NextResponse.json({ error: err.message || "Failed to fetch URL" }, { status: 500 });
  }
}

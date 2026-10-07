import { NextRequest, NextResponse } from "next/server";
import { BlockedUrlError, safeFetch } from "../_ssrf-guard";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const res = await safeFetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NayanUI-OGPreview/1.0; +https://nayanui.com)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${res.status} ${res.statusText}` },
        { status: 422 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "URL does not return HTML content" },
        { status: 422 }
      );
    }

    const html = await res.text();

    const meta: Record<string, string> = {};

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) meta.title = decodeEntities(titleMatch[1].trim());

    // Extract meta tags (name and property based)
    const metaRegex = /<meta\s+([^>]*?)\/?>/gi;
    let m;
    while ((m = metaRegex.exec(html)) !== null) {
      const attrs = m[1];
      const name =
        getAttr(attrs, "property") ||
        getAttr(attrs, "name") ||
        "";
      const content = getAttr(attrs, "content") || "";
      if (name && content) {
        meta[name.toLowerCase()] = decodeEntities(content);
      }
    }

    // Extract link[rel=canonical]
    const canonicalMatch = html.match(
      /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i
    );
    if (canonicalMatch) meta.canonical = canonicalMatch[1];

    // Extract favicon
    const faviconMatch = html.match(
      /<link\s+[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i
    );
    if (faviconMatch) {
      let favicon = faviconMatch[1];
      if (favicon.startsWith("/")) {
        const origin = new URL(targetUrl).origin;
        favicon = origin + favicon;
      }
      meta.favicon = favicon;
    }

    const result = {
      url: targetUrl,
      title: meta["og:title"] || meta["twitter:title"] || meta.title || "",
      description:
        meta["og:description"] ||
        meta["twitter:description"] ||
        meta.description ||
        "",
      image: meta["og:image"] || meta["twitter:image"] || "",
      siteName: meta["og:site_name"] || "",
      type: meta["og:type"] || "website",
      twitterCard: meta["twitter:card"] || "summary_large_image",
      twitterSite: meta["twitter:site"] || "",
      canonical: meta.canonical || targetUrl,
      favicon: meta.favicon || "",
    };

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof BlockedUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch URL" },
      { status: 500 }
    );
  }
}

function getAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(`${name}=["']([^"']*)["']`, "i");
  const match = attrs.match(regex);
  return match ? match[1] : null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

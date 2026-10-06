"use client";

import { useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Upload, Trash2, Link as LinkIcon } from "lucide-react";
import { NButton, NCard, NInput, NTextarea, NBadge } from "@nayan-ui/react";

interface ValidationResult {
  valid: boolean;
  urlCount: number;
  errors: string[];
}

const validateSitemapXml = (content: string): ValidationResult => {
  const errors: string[] = [];
  let urlCount = 0;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "application/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return { valid: false, urlCount: 0, errors: ["Invalid XML: " + parseError.textContent?.slice(0, 200)] };
    }

    const urlset = doc.documentElement;
    if (urlset.tagName !== "urlset") {
      errors.push(`Root element must be <urlset>, found <${urlset.tagName}>.`);
    }

    const urlElements = doc.getElementsByTagName("url");
    urlCount = urlElements.length;

    if (urlCount === 0) {
      errors.push("No <url> elements found in the sitemap.");
    }
    if (urlCount > 50000) {
      errors.push(
        `Sitemap contains ${urlCount} URLs, exceeding the 50,000 URL limit per sitemap file (spec: split into a sitemap index instead).`,
      );
    }
    if (content.length > 50 * 1024 * 1024) {
      errors.push("Sitemap file exceeds the 50 MB uncompressed size limit.");
    }

    const validChangefreq = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

    for (let i = 0; i < urlElements.length; i++) {
      const urlEl = urlElements[i];
      const loc = urlEl.getElementsByTagName("loc")[0];

      if (!loc || !loc.textContent?.trim()) {
        errors.push(`URL entry #${i + 1}: Missing <loc> element.`);
        continue;
      }

      try {
        new URL(loc.textContent.trim());
      } catch {
        errors.push(`URL entry #${i + 1}: Invalid URL format "${loc.textContent.trim()}".`);
      }

      const changefreq = urlEl.getElementsByTagName("changefreq")[0];
      if (changefreq && !validChangefreq.includes(changefreq.textContent?.trim() || "")) {
        errors.push(`URL entry #${i + 1}: Invalid <changefreq> value "${changefreq.textContent}".`);
      }

      const priority = urlEl.getElementsByTagName("priority")[0];
      if (priority) {
        const val = parseFloat(priority.textContent || "");
        if (isNaN(val) || val < 0 || val > 1) {
          errors.push(`URL entry #${i + 1}: Invalid <priority> value "${priority.textContent}" (must be 0.0–1.0).`);
        }
      }
    }
  } catch (err: any) {
    errors.push("Parse error: " + err.message);
  }

  return { valid: errors.length === 0, urlCount, errors };
};

const SitemapValidator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [xml, setXml] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const reader = new FileReader();
    reader.onload = () => setXml(reader.result as string);
    reader.readAsText(fileList[0]);
  }, []);

  const validateLocal = useCallback(() => {
    if (!xml.trim()) return;
    setResult(validateSitemapXml(xml));
  }, [xml]);

  const validateRemote = useCallback(async () => {
    if (!remoteUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/seo-tools/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: remoteUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setXml(json.content);
      setResult(validateSitemapXml(json.content));
    } catch (err: any) {
      setResult({ valid: false, urlCount: 0, errors: [`Failed to fetch: ${err.message}`] });
    } finally {
      setLoading(false);
    }
  }, [remoteUrl]);

  const clear = useCallback(() => {
    setXml("");
    setRemoteUrl("");
    setResult(null);
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <NInput
          label="Remote Sitemap URL"
          className="mb-0 min-w-[250px] flex-1"
          value={remoteUrl}
          onChange={(e) => setRemoteUrl(e.target.value)}
          placeholder="https://example.com/sitemap.xml"
        />
        <NButton onClick={validateRemote} isLoading={loading} loadingText="Fetching…">
          <LinkIcon className="mr-2 h-4 w-4" />
          Validate URL
        </NButton>
      </div>

      <div className="mb-6 text-sm text-muted">— or paste / upload XML directly —</div>

      <NTextarea
        label="Sitemap XML"
        value={xml}
        onChange={(e) => setXml(e.target.value)}
        placeholder='<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
</urlset>'
        textareaClassName="h-[250px] resize-none font-mono text-xs"
      />

      <div className="mt-6 mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={validateLocal} disabled={!xml.trim()}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Validate XML
        </NButton>
        <NButton isOutline onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </NButton>
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
      </div>

      {result && (
        <NCard className="p-4">
          <div className="mb-3 flex items-center gap-3">
            {result.valid ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">Sitemap is valid</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-danger" />
                <span className="font-semibold text-danger">Sitemap has errors</span>
              </>
            )}
            <NBadge size="sm">{result.urlCount} URL{result.urlCount !== 1 ? "s" : ""}</NBadge>
          </div>
          {result.errors.length > 0 && (
            <ul className="space-y-1 text-sm text-danger">
              {result.errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}
        </NCard>
      )}
    </div>
  );
};

export default SitemapValidator;

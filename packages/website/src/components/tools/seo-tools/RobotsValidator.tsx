"use client";

import { useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Upload, Trash2, Link as LinkIcon } from "lucide-react";
import { NButton, NCard, NInput, NTextarea, NBadge } from "@nayan-ui/react";

interface ValidationResult {
  valid: boolean;
  hasUserAgent: boolean;
  hasDisallow: boolean;
  hasSitemap: boolean;
  hasAllow: boolean;
  lineCount: number;
  errors: string[];
  warnings: string[];
}

const validateRobotsTxt = (content: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = content.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));

  let hasUserAgent = false;
  let hasDisallow = false;
  let hasSitemap = false;
  let hasAllow = false;
  let seenUserAgent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    if (lower.startsWith("user-agent:")) {
      hasUserAgent = true;
      seenUserAgent = true;
      const value = line.slice("user-agent:".length).trim();
      if (!value) errors.push(`Line ${i + 1}: User-agent directive has no value.`);
    } else if (lower.startsWith("disallow:")) {
      hasDisallow = true;
      if (!seenUserAgent) {
        errors.push(`Line ${i + 1}: Disallow before any User-agent directive.`);
      }
    } else if (lower.startsWith("allow:")) {
      hasAllow = true;
      if (!seenUserAgent) {
        errors.push(`Line ${i + 1}: Allow before any User-agent directive.`);
      }
    } else if (lower.startsWith("sitemap:")) {
      hasSitemap = true;
      const url = line.slice("sitemap:".length).trim();
      try {
        new URL(url);
      } catch {
        errors.push(`Line ${i + 1}: Invalid Sitemap URL "${url}".`);
      }
    } else if (lower.startsWith("crawl-delay:")) {
      const val = line.slice("crawl-delay:".length).trim();
      if (!val || isNaN(Number(val)) || Number(val) < 0) {
        errors.push(`Line ${i + 1}: Invalid Crawl-delay value "${val}".`);
      }
    } else if (lower.startsWith("host:")) {
      // Non-standard but sometimes used
    } else {
      warnings.push(`Line ${i + 1}: Unrecognized directive "${line}".`);
    }
  }

  if (!hasUserAgent) errors.push("Missing User-agent directive.");
  if (!hasDisallow && !hasAllow) warnings.push("No Disallow or Allow directives found.");
  if (!hasSitemap) warnings.push("No Sitemap directive found — recommended for SEO.");

  return {
    valid: errors.length === 0,
    hasUserAgent,
    hasDisallow,
    hasSitemap,
    hasAllow,
    lineCount: lines.length,
    errors,
    warnings,
  };
};

const RobotsValidator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const reader = new FileReader();
    reader.onload = () => setText(reader.result as string);
    reader.readAsText(fileList[0]);
  }, []);

  const validateLocal = useCallback(() => {
    if (!text.trim()) return;
    setResult(validateRobotsTxt(text));
  }, [text]);

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
      const content = json.content;
      setText(content);
      setResult(validateRobotsTxt(content));
    } catch (err: any) {
      setResult({
        valid: false,
        hasUserAgent: false,
        hasDisallow: false,
        hasSitemap: false,
        hasAllow: false,
        lineCount: 0,
        errors: [`Failed to fetch: ${err.message}`],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }, [remoteUrl]);

  const clear = useCallback(() => {
    setText("");
    setRemoteUrl("");
    setResult(null);
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <NInput
          label="Remote robots.txt URL"
          className="mb-0 min-w-[250px] flex-1"
          value={remoteUrl}
          onChange={(e) => setRemoteUrl(e.target.value)}
          placeholder="https://example.com/robots.txt"
        />
        <NButton onClick={validateRemote} isLoading={loading} loadingText="Fetching…">
          <LinkIcon className="mr-2 h-4 w-4" />
          Validate URL
        </NButton>
      </div>

      <div className="mb-6 text-sm text-muted">— or paste / upload directly —</div>

      <NTextarea
        label="Robots.txt Content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`User-agent: *\nDisallow: /admin\nAllow: /\nSitemap: https://example.com/sitemap.xml`}
        textareaClassName="h-[250px] resize-none font-mono text-xs"
      />

      <div className="mt-6 mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={validateLocal} disabled={!text.trim()}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Validate
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
          accept=".txt,text/plain"
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
                <span className="font-semibold text-success">robots.txt is valid</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-danger" />
                <span className="font-semibold text-danger">robots.txt has errors</span>
              </>
            )}
            <NBadge size="sm">{result.lineCount} directive{result.lineCount !== 1 ? "s" : ""}</NBadge>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <NBadge size="sm" color={result.hasUserAgent ? "success" : "danger"}>
              User-agent {result.hasUserAgent ? "✓" : "✗"}
            </NBadge>
            <NBadge size="sm" color={result.hasDisallow ? "success" : "warning"}>
              Disallow {result.hasDisallow ? "✓" : "✗"}
            </NBadge>
            <NBadge size="sm" color={result.hasAllow ? "success" : "default"}>
              Allow {result.hasAllow ? "✓" : "—"}
            </NBadge>
            <NBadge size="sm" color={result.hasSitemap ? "success" : "warning"}>
              Sitemap {result.hasSitemap ? "✓" : "✗"}
            </NBadge>
          </div>

          {result.errors.length > 0 && (
            <ul className="mb-2 space-y-1 text-sm text-danger">
              {result.errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="space-y-1 text-sm text-warning">
              {result.warnings.map((warn, i) => (
                <li key={i}>⚠ {warn}</li>
              ))}
            </ul>
          )}
        </NCard>
      )}
    </div>
  );
};

export default RobotsValidator;

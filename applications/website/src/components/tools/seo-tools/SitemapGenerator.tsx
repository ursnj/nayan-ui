"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Download, Globe, Loader2, Trash2 } from "lucide-react";
import { NButton, NCard, NInput, NSelect, NBadge, showToast } from "@nayan-ui/react";

const CHANGEFREQ_OPTIONS = [
  { value: "always", label: "Always" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "never", label: "Never" },
];

const MAX_URLS_OPTIONS = [
  { value: "500", label: "500" },
  { value: "1000", label: "1,000" },
  { value: "2000", label: "2,000" },
  { value: "5000", label: "5,000" },
  { value: "10000", label: "10,000" },
];

const DEPTH_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "15", label: "15" },
  { value: "20", label: "20" },
];

const SitemapGenerator = () => {
  const [website, setWebsite] = useState("");
  const [depth, setDepth] = useState("10");
  const [changefreq, setChangefreq] = useState("daily");
  const [maxUrls, setMaxUrls] = useState("5000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const [urlCount, setUrlCount] = useState(0);
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);

  const generate = useCallback(async () => {
    if (!website.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    setUrlCount(0);
    setDiscoveredUrls([]);
    try {
      const res = await fetch("/api/seo-tools/sitemap-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: website.trim(),
          depth: parseInt(depth),
          changefreq,
          maxUrls: parseInt(maxUrls),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Crawl failed");
        return;
      }
      setOutput(json.xml);
      setUrlCount(json.urlCount);
      setDiscoveredUrls(json.urls || []);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [website, depth, changefreq, maxUrls]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/xml" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(u);
  }, [output]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard
      .writeText(output)
      .then(() => showToast("Sitemap XML copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [output]);

  const clear = useCallback(() => {
    setWebsite("");
    setDepth("10");
    setChangefreq("daily");
    setMaxUrls("5000");
    setOutput("");
    setError("");
    setUrlCount(0);
    setDiscoveredUrls([]);
  }, []);

  return (
    <div>
      <NCard className="mb-6 space-y-3 p-4">
        <NInput
          label="Website URL"
          className="mb-0"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NSelect
            label="Crawl Depth"
            className="mb-0"
            options={DEPTH_OPTIONS}
            value={DEPTH_OPTIONS.find((o) => o.value === depth) || null}
            onChange={(opt: any) => setDepth(opt?.value || "10")}
          />
          <NSelect
            label="Change Frequency"
            className="mb-0"
            options={CHANGEFREQ_OPTIONS}
            value={CHANGEFREQ_OPTIONS.find((o) => o.value === changefreq) || null}
            onChange={(opt: any) => setChangefreq(opt?.value || "daily")}
          />
          <NSelect
            label="Max URLs"
            className="mb-0"
            options={MAX_URLS_OPTIONS}
            value={MAX_URLS_OPTIONS.find((o) => o.value === maxUrls) || null}
            onChange={(opt: any) => setMaxUrls(opt?.value || "5000")}
          />
        </div>
      </NCard>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={generate} disabled={!website.trim() || loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Globe className="mr-2 h-4 w-4" />
          )}
          {loading ? "Crawling…" : "Generate Sitemap"}
        </NButton>
        {output && (
          <>
            <NButton isOutline onClick={download}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </NButton>
            <NButton isOutline onClick={copy}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy
            </NButton>
          </>
        )}
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {error && (
        <NCard className="mb-6 p-3 text-sm text-danger">{error}</NCard>
      )}

      {output && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <NBadge size="sm" color="success">{urlCount} URLs discovered</NBadge>
            <NBadge size="sm">Depth: {depth}</NBadge>
            <NBadge size="sm">Frequency: {changefreq}</NBadge>
          </div>

          {discoveredUrls.length > 0 && (
            <NCard className="mb-6 p-4">
              <label className="mb-2 block text-sm font-medium">Discovered URLs</label>
              <div className="max-h-[200px] overflow-auto">
                {discoveredUrls.map((u, i) => (
                  <p key={i} className="truncate font-mono text-xs text-muted">{u}</p>
                ))}
              </div>
            </NCard>
          )}

          <NCard className="p-4">
            <label className="mb-1.5 block text-sm font-medium">Generated Sitemap XML</label>
            <pre className="max-h-[400px] overflow-auto rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
              {output}
            </pre>
          </NCard>
        </>
      )}
    </div>
  );
};

export default SitemapGenerator;

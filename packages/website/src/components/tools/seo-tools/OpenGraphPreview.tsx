"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { NButton, NCard, NInput, NBadge } from "@nayan-ui/react";

interface OgData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterSite: string;
  canonical: string;
  favicon: string;
}

const OpenGraphPreview = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OgData | null>(null);

  const domain = useMemo(() => {
    const src = data?.url || url;
    try {
      return new URL(src).hostname;
    } catch {
      return src || "example.com";
    }
  }, [data, url]);

  const fetchOg = useCallback(async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/seo-tools/og-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch metadata");
        return;
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [url, loading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") fetchOg();
    },
    [fetchOg],
  );

  const title = data?.title || "";
  const description = data?.description || "";
  const image = data?.image || "";
  const siteName = data?.siteName || "";
  const favicon = data?.favicon || "";

  return (
    <div>
      <div className="mb-6 flex items-end gap-3">
        <NInput
          label="Page URL"
          className="mb-0 flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
        />
        <NButton onClick={fetchOg} disabled={!url.trim() || loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {loading ? "Fetching…" : "Preview"}
        </NButton>
      </div>

      {error && (
        <NCard className="mb-6 flex items-center gap-2 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </NCard>
      )}

      {data && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <NBadge size="sm">og:type = {data.type}</NBadge>
            <NBadge size="sm">twitter:card = {data.twitterCard}</NBadge>
            {data.twitterSite && <NBadge size="sm">twitter:site = {data.twitterSite}</NBadge>}
            {!title && <NBadge size="sm" color="warning">Missing title</NBadge>}
            {!description && <NBadge size="sm" color="warning">Missing description</NBadge>}
            {!image && <NBadge size="sm" color="warning">Missing image</NBadge>}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Facebook / LinkedIn Preview */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Facebook / LinkedIn</label>
              <NCard className="overflow-hidden">
                {image ? (
                  <div className="aspect-[1.91/1] w-full bg-default/30">
                    <img
                      src={image}
                      alt="OG preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-default/30 text-sm text-muted">
                    No og:image found
                  </div>
                )}
                <div className="space-y-1 p-3">
                  <p className="text-xs uppercase text-muted">{domain}</p>
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">
                    {title || "No title found"}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted">
                    {description || "No description found"}
                  </p>
                </div>
              </NCard>
            </div>

            {/* Twitter Preview */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Twitter / X</label>
              <NCard className="overflow-hidden">
                {image ? (
                  <div className="aspect-[2/1] w-full bg-default/30">
                    <img
                      src={image}
                      alt="Twitter preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[2/1] w-full items-center justify-center bg-default/30 text-sm text-muted">
                    No twitter:image found
                  </div>
                )}
                <div className="space-y-0.5 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {title || "No title found"}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted">
                    {description || "No description found"}
                  </p>
                  <p className="text-xs text-muted">{domain}</p>
                </div>
              </NCard>
            </div>

            {/* Google Search Preview */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Google Search</label>
              <NCard className="p-4">
                <div className="flex items-center gap-2">
                  {favicon && (
                    <img
                      src={favicon}
                      alt=""
                      className="h-4 w-4 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <p className="truncate text-xs text-muted">{data.canonical || data.url}</p>
                </div>
                <p className="mt-0.5 line-clamp-1 text-base font-medium text-accent">
                  {title || "No title found"}{siteName ? ` — ${siteName}` : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {description || "No description found"}
                </p>
              </NCard>
            </div>

            {/* Slack Preview */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Slack / Discord</label>
              <NCard className="flex overflow-hidden">
                <div className="w-1 shrink-0 bg-accent" />
                <div className="flex-1 p-3">
                  <p className="text-xs font-semibold text-muted">{siteName || domain}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-accent">
                    {title || "No title found"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {description || "No description found"}
                  </p>
                  {image && (
                    <div className="mt-2 aspect-[1.91/1] max-h-[120px] w-auto overflow-hidden rounded">
                      <img
                        src={image}
                        alt="Slack preview"
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </NCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OpenGraphPreview;

"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCopy, Link2, Trash2 } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";

const UtmCampaignBuilder = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");

  const { result, error } = useMemo(() => {
    const trimmed = baseUrl.trim();
    if (!trimmed) return { result: "", error: "" };

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { result: "", error: "Enter a valid base URL, including https://" };
    }

    const params = new URLSearchParams(parsed.search);
    const set = (key: string, value: string) => {
      const v = value.trim();
      if (v) params.set(key, v);
      else params.delete(key);
    };
    set("utm_source", source);
    set("utm_medium", medium);
    set("utm_campaign", campaign);
    set("utm_term", term);
    set("utm_content", content);

    parsed.search = params.toString();
    return { result: parsed.toString(), error: "" };
  }, [baseUrl, source, medium, campaign, term, content]);

  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(result)
      .then(() => showToast("Campaign URL copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [result]);

  const clear = useCallback(() => {
    setBaseUrl("");
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
  }, []);

  return (
    <div>
      <NCard className="mb-6 space-y-3 p-4">
        <NInput
          label="Base URL"
          className="mb-0"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://example.com/landing-page"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NInput label="Campaign Source (utm_source)" className="mb-0" value={source} onChange={(e) => setSource(e.target.value)} placeholder="newsletter" />
          <NInput label="Campaign Medium (utm_medium)" className="mb-0" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="email" />
        </div>
        <NInput label="Campaign Name (utm_campaign)" className="mb-0" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="spring_sale" />
        <div className="grid gap-3 sm:grid-cols-2">
          <NInput label="Campaign Term (optional)" className="mb-0" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="running shoes" />
          <NInput label="Campaign Content (optional)" className="mb-0" value={content} onChange={(e) => setContent(e.target.value)} placeholder="header banner" />
        </div>
      </NCard>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={copy} disabled={!result}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy URL
        </NButton>
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {result && (
        <NCard className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted" />
            <label className="block text-sm font-medium">Campaign URL</label>
          </div>
          <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
            {result}
          </code>
        </NCard>
      )}
    </div>
  );
};

export default UtmCampaignBuilder;

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NCard, NInput, NTextarea } from "@nayan-ui/react";

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

function truncateAtWord(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const sliced = value.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > limit * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trimEnd()}…`;
}

function breadcrumbFromUrl(raw: string): { valid: boolean; display: string } {
  if (!raw.trim()) return { valid: false, display: "" };
  try {
    const url = new URL(raw.trim());
    const segments = url.pathname.split("/").filter(Boolean);
    const parts = [url.hostname.replace(/^www\./, ""), ...segments];
    return { valid: true, display: parts.join(" › ") };
  } catch {
    return { valid: false, display: raw };
  }
}

const SerpSnippetPreview = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const displayTitle = useMemo(() => truncateAtWord(title, TITLE_LIMIT), [title]);
  const displayDescription = useMemo(
    () => truncateAtWord(description, DESCRIPTION_LIMIT),
    [description],
  );
  const breadcrumb = useMemo(() => breadcrumbFromUrl(url), [url]);

  return (
    <div>
      <NCard className="mb-6 space-y-3 p-4">
        <NInput
          label="Page Title"
          className="mb-0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="How to Build a Website in 2024 - Complete Guide"
        />
        <p className={`text-xs ${title.length > TITLE_LIMIT ? "text-danger" : "text-muted"}`}>
          {title.length} / {TITLE_LIMIT} characters {title.length > TITLE_LIMIT && "(will be truncated)"}
        </p>

        <NInput
          label="URL"
          className="mb-0"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/blog/build-a-website"
        />

        <NTextarea
          label="Meta Description"
          className="mb-0"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Learn how to build a modern, responsive website from scratch with our step-by-step guide covering design, development, and deployment."
          textareaClassName="h-[90px] resize-none text-sm"
        />
        <p
          className={`text-xs ${description.length > DESCRIPTION_LIMIT ? "text-danger" : "text-muted"}`}
        >
          {description.length} / {DESCRIPTION_LIMIT} characters{" "}
          {description.length > DESCRIPTION_LIMIT && "(will be truncated)"}
        </p>
      </NCard>

      <NCard className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
          <Search className="h-3.5 w-3.5" />
          Google Search Preview
        </div>

        <div className="rounded-lg bg-white p-4 font-sans" style={{ colorScheme: "light" }}>
          {breadcrumb.display ? (
            <div className="mb-1 flex items-center gap-2 text-sm text-[#4d5156]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ebebeb] text-[10px] uppercase text-[#4d5156]">
                {breadcrumb.display.charAt(0) || "?"}
              </div>
              <span className={!breadcrumb.valid ? "text-[#c5221f]" : ""}>
                {breadcrumb.valid ? breadcrumb.display : "Enter a valid URL (https://example.com/page)"}
              </span>
            </div>
          ) : (
            <div className="mb-1 text-sm text-[#9aa0a6]">example.com › page-url</div>
          )}

          <div className="truncate text-xl leading-tight text-[#1a0dab] hover:underline">
            {displayTitle || "Your page title will appear here"}
          </div>

          <div className="mt-1 text-sm leading-snug text-[#4d5156]">
            {displayDescription ||
              "Your meta description will appear here. Keep it under 160 characters for the best chance of not being truncated in search results."}
          </div>
        </div>
      </NCard>
    </div>
  );
};

export default SerpSnippetPreview;

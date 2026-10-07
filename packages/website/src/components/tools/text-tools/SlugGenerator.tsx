"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

const toSlug = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const SlugGenerator = () => {
  const [input, setInput] = useState("");

  const slug = useMemo(() => toSlug(input), [input]);

  const copy = useCallback(() => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    showToast("Copied to clipboard");
  }, [slug]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {slug && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy Slug
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => setInput("")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label="Enter Text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a title, heading, or any text..."
        textareaClassName="h-[300px] resize-none font-mono text-sm"
      />

      {slug && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">Generated Slug</label>
          <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {slug}
          </code>
        </NCard>
      )}
    </div>
  );
};

export default SlugGenerator;

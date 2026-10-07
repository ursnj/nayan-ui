"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

function minifyHtml(html: string): string {
  // Whitespace inside <pre>/<textarea> is semantically significant, and
  // collapsing it inside <script>/<style> can corrupt string literals, so
  // preserve these blocks verbatim before the generic whitespace collapse.
  const preserved: string[] = [];
  const protectedHtml = html.replace(
    /<(pre|textarea|script|style)[^>]*>[\s\S]*?<\/\1>/gi,
    (match) => {
      preserved.push(match);
      return `__HTMLMIN_PRESERVE_${preserved.length - 1}__`;
    },
  );

  const minified = protectedHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*\/>/g, "/>")
    .trim();

  return minified.replace(/__HTMLMIN_PRESERVE_(\d+)__/g, (_, i) => preserved[Number(i)]);
}

const HtmlMinifier = () => {
  const [input, setInput] = useState("");

  const minified = useMemo(() => (input ? minifyHtml(input) : ""), [input]);

  const savings = useMemo(() => {
    if (!input || !minified) return null;
    const original = new Blob([input]).size;
    const min = new Blob([minified]).size;
    const saved = original - min;
    const pct = original > 0 ? ((saved / original) * 100).toFixed(1) : "0";
    return { original, min, saved, pct };
  }, [input, minified]);

  const copy = useCallback(() => {
    if (!minified) return;
    navigator.clipboard.writeText(minified);
    showToast("Copied to clipboard");
  }, [minified]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {minified && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy Minified
          </NButton>
        )}
        <NButton isOutline onClick={() => setInput("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label="HTML Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste your HTML here..."
        textareaClassName="h-[250px] resize-none font-mono text-sm"
      />

      {savings && (
        <p className="mt-2 text-xs text-muted">
          {savings.original.toLocaleString()} → {savings.min.toLocaleString()} bytes ({savings.pct}% saved)
        </p>
      )}

      {minified && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">Minified Output</label>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
            {minified}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default HtmlMinifier;

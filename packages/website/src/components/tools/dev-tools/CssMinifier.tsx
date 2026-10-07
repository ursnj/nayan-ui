"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

function minifyCss(css: string): string {
  // calc()/clamp()/min()/max() require whitespace around +/- inside the
  // expression (e.g. "calc(10px + 5px)"), so protect their contents before
  // the generic punctuation-whitespace stripping below collapses it into
  // invalid CSS like "calc(10px+5px)".
  const preserved: string[] = [];
  const protectedCss = css.replace(
    /\b(calc|clamp|min|max)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
    (match) => {
      preserved.push(match);
      return `__CSSMIN_PRESERVE_${preserved.length - 1}__`;
    },
  );

  const minified = protectedCss
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;\}/g, "}")
    .replace(/\s+/g, " ")
    .trim();

  return minified.replace(/__CSSMIN_PRESERVE_(\d+)__/g, (_, i) => preserved[Number(i)]);
}

const CssMinifier = () => {
  const [input, setInput] = useState("");

  const minified = useMemo(() => (input ? minifyCss(input) : ""), [input]);

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
        label="CSS Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste your CSS here..."
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

export default CssMinifier;

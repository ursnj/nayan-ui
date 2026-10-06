"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Minimize2, Trash2 } from "lucide-react";
import { NButton, NBadge, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const JsonMinifier = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ original: number; minified: number } | null>(null);

  const minify = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setStats({ original: new Blob([input]).size, minified: new Blob([minified]).size });
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
      setOutput("");
      setStats(null);
    }
  }, [input]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={minify}>
          <Minimize2 className="mr-2 h-4 w-4" />
          Minify
        </NButton>
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => {
            setInput("");
            setOutput("");
            setError("");
            setStats(null);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
        {stats && (
          <div className="flex items-center gap-2">
            <NBadge size="sm">{(stats.original / 1024).toFixed(1)} KB</NBadge>
            <span className="text-xs text-muted">→</span>
            <NBadge size="sm" color="success">{(stats.minified / 1024).toFixed(1)} KB</NBadge>
            <NBadge size="sm" color="accent">
              {Math.round((1 - stats.minified / stats.original) * 100)}% saved
            </NBadge>
          </div>
        )}
      </div>

      {error && (
        <NAlert type={AlertTypes.ERROR} title="Invalid JSON" message={error} className="mb-4" />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <JsonMonacoEditor
          label="Input JSON"
          value={input}
          onChange={setInput}
        />
        <JsonMonacoEditor
          label="Minified Output"
          value={output}
          readOnly
        />
      </div>
    </div>
  );
};

export default JsonMinifier;

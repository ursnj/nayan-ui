"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, Search } from "lucide-react";
import { NButton, NTextarea, NInput, NCard, showToast } from "@nayan-ui/react";

function queryJsonPath(obj: any, path: string): any[] {
  const parts = path
    .replace(/^\$\.?/, "")
    .split(/\.|\[(\d+|\*)\]/)
    .filter((p) => p !== "" && p !== undefined);

  if (parts.length === 0) return [obj];

  let current: any[] = [obj];
  for (const part of parts) {
    const next: any[] = [];
    for (const item of current) {
      if (item == null) continue;
      if (part === "*") {
        if (Array.isArray(item)) next.push(...item);
        else if (typeof item === "object") next.push(...Object.values(item));
      } else if (/^\d+$/.test(part)) {
        const idx = parseInt(part, 10);
        if (Array.isArray(item) && idx < item.length) next.push(item[idx]);
      } else if (typeof item === "object" && part in item) {
        next.push(item[part]);
      }
    }
    current = next;
  }
  return current;
}

function getAllPaths(obj: any, prefix = "$"): string[] {
  const paths: string[] = [prefix];
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      paths.push(...getAllPaths(item, `${prefix}[${i}]`));
    });
  } else if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      paths.push(...getAllPaths(obj[key], `${prefix}.${key}`));
    }
  }
  return paths;
}

const JsonPathFinder = () => {
  const [input, setInput] = useState("");
  const [path, setPath] = useState("$");

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { data: JSON.parse(input), error: "" };
    } catch (e: any) {
      return { data: null, error: e.message || "Invalid JSON" };
    }
  }, [input]);

  const allPaths = useMemo(() => {
    if (!parsed?.data) return [];
    const p = getAllPaths(parsed.data);
    return p.length > 500 ? p.slice(0, 500) : p;
  }, [parsed]);

  const result = useMemo(() => {
    if (!parsed?.data || !path) return null;
    try {
      const values = queryJsonPath(parsed.data, path);
      return { values, error: "" };
    } catch (e: any) {
      return { values: [], error: e.message };
    }
  }, [parsed, path]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => { setInput(""); setPath("$"); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label="JSON Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {parsed?.error && <p className="mt-2 text-sm text-danger">{parsed.error}</p>}

      {parsed?.data && (
        <>
          <div className="mt-4 flex items-end gap-3">
            <NInput
              label="JSON Path"
              className="flex-1"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="$.users[0].name"
            />
            <Search className="mb-2 h-5 w-5 text-muted" />
          </div>

          {result && result.values.length > 0 && (
            <NCard className="mt-4 p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">{result.values.length} Result{result.values.length !== 1 ? "s" : ""}</label>
                <NButton isOutline onClick={() => copy(JSON.stringify(result.values.length === 1 ? result.values[0] : result.values, null, 2))} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Copy
                </NButton>
              </div>
              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
                {JSON.stringify(result.values.length === 1 ? result.values[0] : result.values, null, 2)}
              </pre>
            </NCard>
          )}

          {result?.error && <p className="mt-2 text-sm text-danger">{result.error}</p>}
          {result && !result.error && result.values.length === 0 && (
            <p className="mt-2 text-sm text-muted">No matches found for this path.</p>
          )}

          <NCard className="mt-4 p-4">
            <label className="mb-1.5 block text-sm font-medium">Available Paths ({allPaths.length}{allPaths.length >= 500 ? "+" : ""})</label>
            <div className="max-h-[200px] overflow-auto rounded-lg bg-default/30 p-3">
              {allPaths.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPath(p)}
                  className="block w-full cursor-pointer text-left font-mono text-xs text-foreground hover:text-accent"
                >
                  {p}
                </button>
              ))}
            </div>
          </NCard>
        </>
      )}
    </div>
  );
};

export default JsonPathFinder;

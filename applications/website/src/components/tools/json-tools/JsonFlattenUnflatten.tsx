"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, ArrowDownUp } from "lucide-react";
import { NButton, NTextarea, NCard, NInput, showToast } from "@nayan-ui/react";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function isPlainObject(v: Json): v is { [k: string]: Json } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function flatten(value: Json, delimiter: string): Record<string, Json> {
  const result: Record<string, Json> = {};

  function walk(v: Json, path: string) {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        result[path] = v;
        return;
      }
      v.forEach((item, i) => walk(item, path ? `${path}${delimiter}${i}` : String(i)));
      return;
    }
    if (isPlainObject(v)) {
      const keys = Object.keys(v);
      if (keys.length === 0) {
        result[path] = v;
        return;
      }
      keys.forEach((k) => walk(v[k], path ? `${path}${delimiter}${k}` : k));
      return;
    }
    result[path] = v;
  }

  walk(value, "");
  return result;
}

// Converts any plain object whose keys are a contiguous 0..n-1 numeric
// sequence back into an array — the inverse of flatten()'s numeric path
// segments for array elements.
function arrayify(node: Json): Json {
  if (Array.isArray(node)) return node.map(arrayify);
  if (isPlainObject(node)) {
    const keys = Object.keys(node);
    const isArrayLike = keys.length > 0 && keys.every((k, idx) => k === String(idx));
    if (isArrayLike) return keys.map((k) => arrayify(node[k]));
    const out: Record<string, Json> = {};
    for (const k of keys) out[k] = arrayify(node[k]);
    return out;
  }
  return node;
}

function unflatten(flat: Record<string, Json>, delimiter: string): Json {
  const root: Record<string, Json> = {};
  for (const [path, value] of Object.entries(flat)) {
    if (path === "") return value;
    const segments = delimiter ? path.split(delimiter) : [path];
    let cursor: any = root;
    segments.forEach((seg, i) => {
      if (i === segments.length - 1) {
        cursor[seg] = value;
      } else {
        if (cursor[seg] === undefined || typeof cursor[seg] !== "object" || cursor[seg] === null) {
          cursor[seg] = {};
        }
        cursor = cursor[seg];
      }
    });
  }
  return arrayify(root);
}

const JsonFlattenUnflatten = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"flatten" | "unflatten">("flatten");
  const [delimiter, setDelimiter] = useState(".");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      const result =
        mode === "flatten" ? flatten(parsed, delimiter || ".") : unflatten(parsed, delimiter || ".");
      return { output: JSON.stringify(result, null, 2), error: "" };
    } catch (e: any) {
      return { output: "", error: e.message || "Invalid JSON" };
    }
  }, [input, mode, delimiter]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const swap = useCallback(() => {
    setMode((m) => (m === "flatten" ? "unflatten" : "flatten"));
    if (output) setInput(output);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={swap}>
          <ArrowDownUp className="mr-2 h-4 w-4" />
          {mode === "flatten" ? "Switch to Unflatten" : "Switch to Flatten"}
        </NButton>
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton isOutline onClick={() => setInput("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NInput
        label="Delimiter"
        className="mb-4 max-w-24"
        value={delimiter}
        onChange={(e) => setDelimiter(e.target.value || ".")}
      />

      <NTextarea
        label={mode === "flatten" ? "Nested JSON" : "Flattened JSON"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          mode === "flatten"
            ? '{"user": {"name": "Alice", "roles": ["admin", "editor"]}}'
            : '{"user.name": "Alice", "user.roles.0": "admin", "user.roles.1": "editor"}'
        }
        textareaClassName="h-[220px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">
            {mode === "flatten" ? "Flattened JSON" : "Nested JSON"}
          </label>
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default JsonFlattenUnflatten;

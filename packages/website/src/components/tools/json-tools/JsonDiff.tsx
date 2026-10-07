"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

interface DiffEntry {
  path: string;
  type: "added" | "removed" | "changed";
  oldValue?: any;
  newValue?: any;
}

function diffJson(a: any, b: any, path = "$"): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  if (a === b) return diffs;
  if (a === null || b === null || typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    diffs.push({ path, type: "changed", oldValue: a, newValue: b });
    return diffs;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= a.length) diffs.push({ path: `${path}[${i}]`, type: "added", newValue: b[i] });
      else if (i >= b.length) diffs.push({ path: `${path}[${i}]`, type: "removed", oldValue: a[i] });
      else diffs.push(...diffJson(a[i], b[i], `${path}[${i}]`));
    }
    return diffs;
  }

  if (typeof a === "object" && typeof b === "object") {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
      const childPath = `${path}.${key}`;
      if (!(key in a)) diffs.push({ path: childPath, type: "added", newValue: b[key] });
      else if (!(key in b)) diffs.push({ path: childPath, type: "removed", oldValue: a[key] });
      else diffs.push(...diffJson(a[key], b[key], childPath));
    }
    return diffs;
  }

  if (a !== b) diffs.push({ path, type: "changed", oldValue: a, newValue: b });
  return diffs;
}

const colorMap = { added: "text-accent", removed: "text-danger", changed: "text-warning" };
const labelMap = { added: "Added", removed: "Removed", changed: "Changed" };

const JsonDiff = () => {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const result = useMemo(() => {
    if (!left.trim() || !right.trim()) return null;
    try {
      const a = JSON.parse(left);
      const b = JSON.parse(right);
      return { diffs: diffJson(a, b), error: "" };
    } catch (e: any) {
      return { diffs: [], error: e.message || "Invalid JSON" };
    }
  }, [left, right]);

  const copy = useCallback(() => {
    if (!result || result.error || result.diffs.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(result.diffs, null, 2));
    showToast("Copied to clipboard");
  }, [result]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => { setLeft(""); setRight(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NTextarea
          label="Original JSON"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder='{"name": "Alice", "age": 30}'
          textareaClassName="h-[250px] resize-none font-mono text-sm"
        />
        <NTextarea
          label="Modified JSON"
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder='{"name": "Alice", "age": 31, "city": "NYC"}'
          textareaClassName="h-[250px] resize-none font-mono text-sm"
        />
      </div>

      {result?.error && <p className="mt-3 text-sm text-danger">{result.error}</p>}

      {result && !result.error && (
        <NCard className="mt-4 p-4">
          {result.diffs.length === 0 ? (
            <p className="font-medium text-accent">✓ Identical — no differences found</p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">
                  {result.diffs.length} difference{result.diffs.length !== 1 ? "s" : ""}
                </label>
                <NButton isOutline onClick={copy} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Copy
                </NButton>
              </div>
              <div className="space-y-1">
                {result.diffs.map((d, i) => (
                  <div key={i} className="rounded bg-default/30 px-3 py-2 text-sm">
                    <span className={`mr-2 text-xs font-medium ${colorMap[d.type]}`}>{labelMap[d.type]}</span>
                    <code className="text-xs text-muted">{d.path}</code>
                    {d.type === "changed" && (
                      <span className="ml-2 text-foreground">
                        <code className="text-danger line-through">{JSON.stringify(d.oldValue)}</code>
                        {" → "}
                        <code className="text-accent">{JSON.stringify(d.newValue)}</code>
                      </span>
                    )}
                    {d.type === "added" && <code className="ml-2 text-accent">{JSON.stringify(d.newValue)}</code>}
                    {d.type === "removed" && <code className="ml-2 text-danger line-through">{JSON.stringify(d.oldValue)}</code>}
                  </div>
                ))}
              </div>
            </>
          )}
        </NCard>
      )}
    </div>
  );
};

export default JsonDiff;

"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, ArrowDownUp } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

type JsonObject = { [k: string]: string | number | boolean | null | (string | number | boolean | null)[] };

// Array values are emitted as a repeated key: ?tag=a&tag=b — the most widely
// interoperable convention (no bracket-notation ambiguity, and it round-trips
// cleanly with URLSearchParams on the way back).
function jsonToQueryString(obj: JsonObject): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item === null ? "" : String(item));
    } else {
      params.append(key, value === null ? "" : String(value));
    }
  }
  return params.toString();
}

function queryStringToJson(qs: string): JsonObject {
  const cleaned = qs.trim().replace(/^\?/, "");
  const params = new URLSearchParams(cleaned);
  const result: Record<string, string | string[]> = {};
  for (const key of params.keys()) {
    if (result[key] !== undefined) continue; // already handled via getAll below
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

const JsonQueryStringConverter = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"toQuery" | "toJson">("toQuery");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (mode === "toQuery") {
        const parsed = JSON.parse(input);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return { output: "", error: "Input must be a JSON object, e.g. {\"key\": \"value\"}" };
        }
        return { output: jsonToQueryString(parsed), error: "" };
      }
      return { output: JSON.stringify(queryStringToJson(input), null, 2), error: "" };
    } catch (e: any) {
      return { output: "", error: e.message || "Invalid input" };
    }
  }, [input, mode]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const swap = useCallback(() => {
    setMode((m) => (m === "toQuery" ? "toJson" : "toQuery"));
    if (output) setInput(output);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={swap}>
          <ArrowDownUp className="mr-2 h-4 w-4" />
          {mode === "toQuery" ? "Switch to Query String → JSON" : "Switch to JSON → Query String"}
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

      <p className="mb-3 text-xs text-muted">
        Array values are encoded as a repeated key — <code>{"{\"tag\":[\"a\",\"b\"]}"}</code> becomes{" "}
        <code>tag=a&amp;tag=b</code> — and repeated keys parse back into an array.
      </p>

      <NTextarea
        label={mode === "toQuery" ? "JSON Input" : "Query String Input"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          mode === "toQuery"
            ? '{"q": "hello world", "tag": ["a", "b"]}'
            : "q=hello+world&tag=a&tag=b"
        }
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">
            {mode === "toQuery" ? "Query String" : "JSON Output"}
          </label>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default JsonQueryStringConverter;

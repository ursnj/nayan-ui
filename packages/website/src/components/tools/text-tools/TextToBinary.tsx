"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, ArrowDownUp } from "lucide-react";
import { NButton, NTextarea, NCard, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const FORMAT_OPTIONS: ReactSelectOption[] = [
  { label: "Binary", value: "binary" },
  { label: "Hexadecimal", value: "hex" },
  { label: "Octal", value: "octal" },
  { label: "Decimal", value: "decimal" },
];

const TextToBinary = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [format, setFormat] = useState<ReactSelectOption>(FORMAT_OPTIONS[0]);

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      if (mode === "encode") {
        const result = Array.from(input)
          .map((c) => {
            const code = c.codePointAt(0) ?? 0;
            if (format.value === "binary") return code.toString(2).padStart(8, "0");
            if (format.value === "hex") return code.toString(16).padStart(2, "0");
            if (format.value === "octal") return code.toString(8).padStart(3, "0");
            return String(code);
          })
          .join(" ");
        return { output: result, error: "" };
      } else {
        const parts = input.trim().split(/\s+/);
        const base = format.value === "binary" ? 2 : format.value === "hex" ? 16 : format.value === "octal" ? 8 : 10;
        const codes = parts.map((p) => parseInt(p, base));
        if (codes.some((n) => Number.isNaN(n))) {
          return { output: "", error: `Invalid ${format.label.toLowerCase()} value` };
        }
        return { output: codes.map((n) => String.fromCodePoint(n)).join(""), error: "" };
      }
    } catch {
      return { output: "", error: "Conversion failed" };
    }
  }, [input, mode, format]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => setMode((m) => (m === "encode" ? "decode" : "encode"))}>
          <ArrowDownUp className="mr-2 h-4 w-4" />
          {mode === "encode" ? "Switch to Decode" : "Switch to Encode"}
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

      <NSelect
        label="Format"
        className="mb-4 max-w-52"
        value={format}
        options={FORMAT_OPTIONS}
        onChange={(v) => { if (v) setFormat(v); }}
        isSearchable={false}
      />

      <NTextarea
        label={mode === "encode" ? "Text Input" : `${format.label} Input`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "encode" ? "Enter text to convert..." : `Enter ${format.value} values separated by spaces...`}
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">{mode === "encode" ? `${format.label} Output` : "Decoded Text"}</label>
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default TextToBinary;

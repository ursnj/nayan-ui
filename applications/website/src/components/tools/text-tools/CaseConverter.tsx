"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Trash2, CaseSensitive } from "lucide-react";
import { NButton, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const toTitleCase = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const toSentenceCase = (s: string) =>
  s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());

const toCamelCase = (s: string) =>
  s
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

const toSnakeCase = (s: string) =>
  s
    .trim()
    .replace(/([A-Z])/g, "_$1")
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

const toKebabCase = (s: string) =>
  s
    .trim()
    .replace(/([A-Z])/g, "-$1")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const CONVERSIONS = [
  { label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
  { label: "lowercase", fn: (s: string) => s.toLowerCase() },
  { label: "Title Case", fn: toTitleCase },
  { label: "Sentence case", fn: toSentenceCase },
  { label: "camelCase", fn: toCamelCase },
  { label: "snake_case", fn: toSnakeCase },
  { label: "kebab-case", fn: toKebabCase },
  { label: "aLtErNaTiNg", fn: (s: string) => s.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("") },
];

const CaseConverter = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const convert = useCallback(
    (fn: (s: string) => string) => {
      setOutput(fn(input));
    },
    [input],
  );

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CONVERSIONS.map((c) => (
          <NButton key={c.label} isOutline onClick={() => convert(c.fn)}>
            {c.label}
          </NButton>
        ))}
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
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label="Input Text"
          value={input}
          onChange={setInput}
          height="500px"
        />
        <MonacoEditor
          label="Converted Output"
          value={output}
          readOnly
          height="500px"
        />
      </div>
    </div>
  );
};

export default CaseConverter;

"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Sparkles, Trash2 } from "lucide-react";
import { NButton, NSelect, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const INDENT_OPTIONS = [
  { label: "2 spaces", value: "2" },
  { label: "4 spaces", value: "4" },
  { label: "1 tab", value: "tab" },
];

const JsonFormatter = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indentOption, setIndentOption] = useState(INDENT_OPTIONS[0]);

  const format = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const indent = indentOption.value === "tab" ? "\t" : Number(indentOption.value);
      setOutput(JSON.stringify(parsed, null, indent));
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
      setOutput("");
    }
  }, [input, indentOption]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <NSelect
        label="Indent"
        className="mb-4 max-w-52"
        value={indentOption}
        options={INDENT_OPTIONS}
        onChange={(val) => { if (val) setIndentOption(val); }}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={format}>
          <Sparkles className="mr-2 h-4 w-4" />
          Format
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
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
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
          label="Formatted Output"
          value={output}
          readOnly
        />
      </div>
    </div>
  );
};

export default JsonFormatter;

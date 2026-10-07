"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Sparkles, Trash2 } from "lucide-react";
import { NButton, NSelect, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";
import { formatXml, parseXml, serializeXml } from "./xmlHelpers";

const INDENT_OPTIONS = [
  { label: "2 spaces", value: "2" },
  { label: "4 spaces", value: "4" },
];

const XmlFormatter = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indentOption, setIndentOption] = useState(INDENT_OPTIONS[0]);

  const format = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      parseXml(input);
      setOutput(formatXml(input, Number(indentOption.value)));
    } catch (e: any) {
      setError(e.message || "Invalid XML");
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
        <NAlert type={AlertTypes.ERROR} title="Invalid XML" message={error} className="mb-4" />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <XmlMonacoEditor
          label="Input XML"
          value={input}
          onChange={setInput}
        />
        <XmlMonacoEditor
          label="Formatted Output"
          value={output}
          readOnly
        />
      </div>
    </div>
  );
};

export default XmlFormatter;

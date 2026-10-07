"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, Braces, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";
import { parseXml, xmlToObject } from "./xmlHelpers";

const XmlToJson = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const doc = parseXml(input);
      const obj = xmlToObject(doc.documentElement);
      const result = { [doc.documentElement.tagName]: obj };
      setOutput(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setError(e.message || "Invalid XML");
      setOutput("");
    }
  }, [input]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert}>
          <Braces className="mr-2 h-4 w-4" />
          Convert to JSON
        </NButton>
        {output && (
          <>
            <NButton isOutline onClick={copy}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy
            </NButton>
            <NButton isOutline onClick={download}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </NButton>
          </>
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
          label="JSON Output"
          value={output}
          readOnly
          language="json"
        />
      </div>
    </div>
  );
};

export default XmlToJson;

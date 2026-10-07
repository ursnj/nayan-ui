"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, FileText, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const toYaml = (data: any, indent = 0): string => {
  const pad = "  ".repeat(indent);
  if (data === null || data === undefined) return "null";
  if (typeof data === "boolean") return data ? "true" : "false";
  if (typeof data === "number") return String(data);
  if (typeof data === "string") {
    if (data.includes("\n")) return `|\n${data.split("\n").map((l) => pad + "  " + l).join("\n")}`;
    if (/[:{}\[\],&*?|>!'"%@`#]/.test(data) || data === "" || data === "true" || data === "false" || data === "null" || !isNaN(Number(data))) return JSON.stringify(data);
    return data;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return "[]";
    return data.map((item) => {
      const val = toYaml(item, indent + 1);
      if (typeof item === "object" && item !== null) {
        const lines = val.split("\n");
        return `${pad}- ${lines[0]}\n${lines.slice(1).map((l) => pad + "  " + l).join("\n")}`.trimEnd();
      }
      return `${pad}- ${val}`;
    }).join("\n");
  }
  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (entries.length === 0) return "{}";
    return entries.map(([key, val]) => {
      const yamlKey = /[:{}\[\],&*?|>!'"%@`#\s]/.test(key) ? JSON.stringify(key) : key;
      if (typeof val === "object" && val !== null) {
        const nested = toYaml(val, indent + 1);
        return `${pad}${yamlKey}:\n${nested}`;
      }
      return `${pad}${yamlKey}: ${toYaml(val, indent + 1)}`;
    }).join("\n");
  }
  return String(data);
};

const JsonToYaml = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(toYaml(parsed));
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
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
    const blob = new Blob([output], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.yaml";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert}>
          <FileText className="mr-2 h-4 w-4" />
          Convert to YAML
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
        <NAlert type={AlertTypes.ERROR} title="Invalid JSON" message={error} className="mb-4" />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <JsonMonacoEditor
          label="Input JSON"
          value={input}
          onChange={setInput}
        />
        <JsonMonacoEditor
          label="YAML Output"
          value={output}
          readOnly
          language="yaml"
        />
      </div>
    </div>
  );
};

export default JsonToYaml;

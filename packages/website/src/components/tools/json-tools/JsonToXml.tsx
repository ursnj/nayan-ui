"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, FileCode, Trash2 } from "lucide-react";
import { NButton, NInput, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const escXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const sanitizeTag = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safe = /^[0-9]/.test(cleaned) || cleaned === "" ? `_${cleaned}` : cleaned;
  return safe;
};

const toXml = (data: any, tag: string, indent: string): string => {
  if (data === null || data === undefined) return `${indent}<${tag} />`;
  if (typeof data !== "object") return `${indent}<${tag}>${escXml(String(data))}</${tag}>`;
  if (Array.isArray(data)) {
    return data.map((item) => toXml(item, "item", indent)).join("\n");
  }
  const entries = Object.entries(data);
  if (entries.length === 0) return `${indent}<${tag} />`;
  const children = entries
    .map(([key, val]) => {
      const safeKey = sanitizeTag(key);
      if (Array.isArray(val)) {
        return val.map((item) => toXml(item, safeKey, indent + "  ")).join("\n");
      }
      return toXml(val, safeKey, indent + "  ");
    })
    .join("\n");
  return `${indent}<${tag}>\n${children}\n${indent}</${tag}>`;
};

const JsonToXml = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [rootTag, setRootTag] = useState("root");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(parsed, sanitizeTag(rootTag), "")}`;
      setOutput(xml);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
      setOutput("");
    }
  }, [input, rootTag]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.xml";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NInput
          label="Root tag"
          value={rootTag}
          onChange={(e) => setRootTag(e.target.value || "root")}
          className="mb-0 w-32"
        />
        <NButton onClick={convert}>
          <FileCode className="mr-2 h-4 w-4" />
          Convert to XML
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
          label="XML Output"
          value={output}
          readOnly
          language="xml"
        />
      </div>
    </div>
  );
};

export default JsonToXml;

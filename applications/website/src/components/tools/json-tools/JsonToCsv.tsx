"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const escCsv = (val: any): string => {
  let s: string;
  if (val === null || val === undefined) s = "";
  else if (typeof val === "object") s = JSON.stringify(val);
  else s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
};

const jsonToCsv = (data: any): string => {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return "";
  const flat = arr.filter((r) => r && typeof r === "object" && !Array.isArray(r));
  if (flat.length === 0) return arr.map((v) => escCsv(v)).join("\n");
  const keys = [...new Set(flat.flatMap(Object.keys))];
  const header = keys.map(escCsv).join(",");
  const rows = flat.map((row) => keys.map((k) => escCsv(row[k])).join(","));
  return [header, ...rows].join("\n");
};

const JsonToCsv = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(jsonToCsv(parsed));
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
    const blob = new Blob([output], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Convert to CSV
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
          label="CSV Output"
          value={output}
          readOnly
          language="plaintext"
        />
      </div>
    </div>
  );
};

export default JsonToCsv;

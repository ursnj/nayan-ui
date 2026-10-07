"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, Table, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";
import { parseXml, xmlToObject } from "./xmlHelpers";

const escTsv = (val: any): string => {
  const s = val === null || val === undefined ? "" : String(val);
  return s.replace(/\t/g, " ").replace(/\n/g, " ");
};

const objectsToTsv = (data: any): string => {
  const arr = Array.isArray(data) ? data : [data];
  const flat = arr.filter((r) => r && typeof r === "object" && !Array.isArray(r));
  if (flat.length === 0) return arr.map((v) => escTsv(v)).join("\n");
  const keys = [...new Set(flat.flatMap(Object.keys))];
  const header = keys.join("\t");
  const rows = flat.map((row) => keys.map((k) => escTsv(typeof row[k] === "object" ? JSON.stringify(row[k]) : row[k])).join("\t"));
  return [header, ...rows].join("\n");
};

const XmlToTsv = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const doc = parseXml(input);
      const obj = xmlToObject(doc.documentElement);
      const children = Object.values(obj);
      const rows = children.length === 1 && Array.isArray(children[0]) ? children[0] : [obj];
      setOutput(objectsToTsv(rows));
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
    const blob = new Blob([output], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.tsv";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert}>
          <Table className="mr-2 h-4 w-4" />
          Convert to TSV
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
          label="TSV Output"
          value={output}
          readOnly
          language="plaintext"
        />
      </div>
    </div>
  );
};

export default XmlToTsv;

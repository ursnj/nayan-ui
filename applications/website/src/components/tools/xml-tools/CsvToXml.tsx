"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { NButton, NInput, NTextarea, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";
import { escXml, sanitizeXmlTag } from "./xmlHelpers";

// Mirrors the quoted-field-aware CSV parser in
// applications/tools/src/json-tools/CsvToJson.tsx.
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) {
        result.push(current);
        current = "";
      } else current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(csv: string, delimiter: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0], delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

function csvToXml(csv: string, delimiter: string, rootTag: string, rowTag: string): string {
  const rows = parseCsv(csv, delimiter);
  const safeRoot = sanitizeXmlTag(rootTag || "root");
  const safeRow = sanitizeXmlTag(rowTag || "row");
  if (rows.length === 0) return `<?xml version="1.0" encoding="UTF-8"?>\n<${safeRoot} />`;

  const body = rows
    .map((row) => {
      const fields = Object.entries(row)
        .map(([key, val]) => {
          const safeKey = sanitizeXmlTag(key);
          return val === "" ? `    <${safeKey} />` : `    <${safeKey}>${escXml(val)}</${safeKey}>`;
        })
        .join("\n");
      return `  <${safeRow}>\n${fields}\n  </${safeRow}>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${safeRoot}>\n${body}\n</${safeRoot}>`;
}

const CsvToXml = () => {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [rootTag, setRootTag] = useState("root");
  const [rowTag, setRowTag] = useState("row");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const xml = csvToXml(input, delimiter, rootTag, rowTag);
      setOutput(xml);
    } catch (e: any) {
      setError(e.message || "Failed to parse CSV");
      setOutput("");
    }
  }, [input, delimiter, rootTag, rowTag]);

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
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <NInput
          label="Delimiter"
          className="mb-0 max-w-24"
          maxLength={1}
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value || ",")}
        />
        <NInput
          label="Root tag"
          className="mb-0 w-32"
          value={rootTag}
          onChange={(e) => setRootTag(e.target.value || "root")}
        />
        <NInput
          label="Row tag"
          className="mb-0 w-32"
          value={rowTag}
          onChange={(e) => setRowTag(e.target.value || "row")}
        />
        <NButton onClick={convert}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
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

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <NTextarea
          label="CSV Input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'name,age,bio\nAlice,30,"Likes cats, dogs & birds"\nBob,25,"Says ""hi"""'}
          textareaClassName="h-[250px] resize-none font-mono text-sm"
        />
        <XmlMonacoEditor label="XML Output" value={output} readOnly language="xml" />
      </div>
    </div>
  );
};

export default CsvToXml;

"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, NInput, showToast } from "@nayan-ui/react";

function csvToJson(csv: string, delimiter: string): any[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0], delimiter);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { result.push(current); current = ""; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}

const CsvToJson = () => {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const json = csvToJson(input, delimiter);
      if (json.length === 0) return { output: "", error: "No data rows found. Ensure the CSV has a header row and at least one data row." };
      return { output: JSON.stringify(json, null, 2), error: "" };
    } catch {
      return { output: "", error: "Failed to parse CSV" };
    }
  }, [input, delimiter]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy JSON
          </NButton>
        )}
        <NButton isOutline onClick={() => setInput("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NInput
        label="Delimiter"
        className="mb-4 max-w-24"
        maxLength={1}
        value={delimiter}
        onChange={(e) => setDelimiter(e.target.value || ",")}
      />

      <NTextarea
        label="CSV Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="name,age,city&#10;Alice,30,New York&#10;Bob,25,London"
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">JSON Output</label>
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default CsvToJson;

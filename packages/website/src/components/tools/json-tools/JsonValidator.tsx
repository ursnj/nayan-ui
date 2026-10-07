"use client";

import { useCallback, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

interface ValidationResult {
  valid: boolean;
  message: string;
  line?: number;
  column?: number;
  type?: string;
  nodeCount?: number;
  depth?: number;
}

const analyzeJson = (input: string): ValidationResult => {
  if (!input.trim()) return { valid: false, message: "Input is empty" };
  try {
    const parsed = JSON.parse(input);
    const type = Array.isArray(parsed) ? "array" : typeof parsed;
    let nodeCount = 0;
    let maxDepth = 0;
    const countNodes = (obj: any, depth: number) => {
      nodeCount++;
      if (depth > maxDepth) maxDepth = depth;
      if (obj && typeof obj === "object") {
        for (const val of Object.values(obj)) countNodes(val, depth + 1);
      }
    };
    countNodes(parsed, 0);
    return { valid: true, message: "Valid JSON", type, nodeCount, depth: maxDepth };
  } catch (e: any) {
    const msg = e.message || "Invalid JSON";
    const posMatch = msg.match(/position\s+(\d+)/i);
    let line: number | undefined;
    let column: number | undefined;
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const before = input.slice(0, pos);
      line = (before.match(/\n/g) || []).length + 1;
      column = pos - before.lastIndexOf("\n");
    }
    return { valid: false, message: msg, line, column };
  }
};

const JsonValidator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = useCallback(() => {
    setResult(analyzeJson(input));
  }, [input]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={validate}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Validate
        </NButton>
        <NButton
          isOutline
          onClick={() => {
            setInput("");
            setResult(null);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {result && result.valid && (
        <NAlert
          type={AlertTypes.SUCCESS}
          title="Valid JSON"
          message={`Type: ${result.type} · Nodes: ${result.nodeCount} · Depth: ${result.depth}`}
          className="mb-4"
        />
      )}
      {result && !result.valid && (
        <NAlert
          type={AlertTypes.ERROR}
          title="Invalid JSON"
          message={`${result.message}${result.line ? ` (Line ${result.line}, Column ${result.column})` : ""}`}
          className="mb-4"
        />
      )}

      <JsonMonacoEditor
        label="Input JSON"
        value={input}
        onChange={setInput}
      />
    </div>
  );
};

export default JsonValidator;

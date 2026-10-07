"use client";

import { useCallback, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";

interface ValidationResult {
  valid: boolean;
  message: string;
  elementCount?: number;
  depth?: number;
  rootTag?: string;
}

const analyzeXml = (input: string): ValidationResult => {
  if (!input.trim()) return { valid: false, message: "Input is empty" };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "application/xml");
    const err = doc.querySelector("parsererror");
    if (err) throw new Error(err.textContent?.replace(/\n/g, " ").trim() || "Invalid XML");

    let elementCount = 0;
    let maxDepth = 0;
    const walk = (node: Element, depth: number) => {
      elementCount++;
      if (depth > maxDepth) maxDepth = depth;
      Array.from(node.children).forEach((child) => walk(child, depth + 1));
    };
    walk(doc.documentElement, 0);

    return {
      valid: true,
      message: "Valid XML",
      rootTag: doc.documentElement.tagName,
      elementCount,
      depth: maxDepth,
    };
  } catch (e: any) {
    return { valid: false, message: e.message || "Invalid XML" };
  }
};

const XmlValidator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = useCallback(() => {
    setResult(analyzeXml(input));
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
          title="Valid XML"
          message={`Root: <${result.rootTag}> · Elements: ${result.elementCount} · Depth: ${result.depth}`}
          className="mb-4"
        />
      )}
      {result && !result.valid && (
        <NAlert
          type={AlertTypes.ERROR}
          title="Invalid XML"
          message={result.message}
          className="mb-4"
        />
      )}

      <XmlMonacoEditor
        label="Input XML"
        value={input}
        onChange={setInput}
      />
    </div>
  );
};

export default XmlValidator;

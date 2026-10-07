"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Route, Trash2 } from "lucide-react";
import { NButton, NInput, NAlert, AlertTypes, NBadge, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";

type XPathRun = {
  kind: "nodes" | "scalar";
  nodes?: string[];
  scalarType?: "string" | "number" | "boolean";
  scalarValue?: string;
};

const nodeLabel = (node: Node): string => {
  if (node.nodeType === Node.ATTRIBUTE_NODE) return `@${(node as Attr).name}`;
  if (node.nodeType === Node.ELEMENT_NODE) return `<${(node as Element).tagName}>`;
  if (node.nodeType === Node.TEXT_NODE) return "#text";
  if (node.nodeType === Node.COMMENT_NODE) return "#comment";
  return node.nodeName;
};

const nodeStringValue = (node: Node): string => {
  if (node.nodeType === Node.ATTRIBUTE_NODE) return (node as Attr).value;
  return node.textContent ?? "";
};

function runXPath(xml: string, expression: string): XPathRun {
  if (!expression.trim()) throw new Error("Enter an XPath expression");

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) {
    throw new Error(parseErr.textContent?.replace(/\s+/g, " ").trim() || "Invalid XML");
  }

  let result: XPathResult;
  try {
    result = doc.evaluate(expression, doc, null, XPathResult.ANY_TYPE, null);
  } catch (e: any) {
    throw new Error(e?.message || "Invalid XPath expression");
  }

  switch (result.resultType) {
    case XPathResult.STRING_TYPE:
      return { kind: "scalar", scalarType: "string", scalarValue: result.stringValue };
    case XPathResult.NUMBER_TYPE:
      return { kind: "scalar", scalarType: "number", scalarValue: String(result.numberValue) };
    case XPathResult.BOOLEAN_TYPE:
      return { kind: "scalar", scalarType: "boolean", scalarValue: String(result.booleanValue) };
    default: {
      // ANY_TYPE resolves node-set expressions to an (un)ordered node iterator.
      const nodes: string[] = [];
      let node = result.iterateNext();
      while (node) {
        nodes.push(`${nodeLabel(node)}: ${nodeStringValue(node)}`);
        node = result.iterateNext();
      }
      return { kind: "nodes", nodes };
    }
  }
}

const SAMPLE_XML = `<library>
  <book id="1" available="true">
    <title>The Pragmatic Programmer</title>
    <author>David Thomas</author>
  </book>
  <book id="2" available="false">
    <title>Clean Code</title>
    <author>Robert Martin</author>
  </book>
</library>`;

const XPathTester = () => {
  const [xml, setXml] = useState(SAMPLE_XML);
  const [expression, setExpression] = useState("//book[@available='true']/title");
  const [run, setRun] = useState<XPathRun | null>(null);
  const [error, setError] = useState("");

  const evaluate = useCallback(() => {
    setError("");
    setRun(null);
    try {
      setRun(runXPath(xml, expression));
    } catch (e: any) {
      setError(e.message || "Evaluation failed");
    }
  }, [xml, expression]);

  const copy = useCallback(() => {
    if (!run) return;
    const text = run.kind === "nodes" ? (run.nodes ?? []).join("\n") : run.scalarValue ?? "";
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, [run]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <NInput
          label="XPath expression"
          className="mb-0 min-w-80 flex-1"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="//book[@available='true']/title"
        />
        <NButton onClick={evaluate}>
          <Route className="mr-2 h-4 w-4" />
          Evaluate
        </NButton>
        {run && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy Result
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => {
            setXml("");
            setExpression("");
            setRun(null);
            setError("");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {error && <NAlert type={AlertTypes.ERROR} title="XPath Error" message={error} className="mb-4" />}

      <XmlMonacoEditor label="Input XML" value={xml} onChange={setXml} />

      {run && (
        <div className="mt-4 rounded-lg border border-default/40 p-4">
          {run.kind === "scalar" ? (
            <div className="flex items-center gap-2">
              <NBadge size="sm">{run.scalarType}</NBadge>
              <code className="font-mono text-sm text-foreground">{run.scalarValue}</code>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <NBadge size="sm">{run.nodes?.length ?? 0} match{run.nodes?.length === 1 ? "" : "es"}</NBadge>
              </div>
              {run.nodes && run.nodes.length > 0 ? (
                <ul className="max-h-[320px] space-y-1 overflow-auto font-mono text-sm text-foreground">
                  {run.nodes.map((n, i) => (
                    <li key={i} className="rounded bg-default/30 px-2 py-1 break-all">
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No matching nodes.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default XPathTester;

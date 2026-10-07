"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Download, FileCode2, Trash2 } from "lucide-react";
import { NButton, NInput, NTextarea, NAlert, AlertTypes, showToast } from "@nayan-ui/react";
import XmlMonacoEditor from "./XmlMonacoEditor";
import { objectToXmlDocument } from "./xmlHelpers";

// Mirrors applications/tools/src/json-tools/YamlToJson.tsx's parser so both
// tools stay behaviorally consistent (indented lists, flush lists, nested
// mappings, and top-level sequences all parse the same way).
function isMappingEntry(val: string): boolean {
  if (val.startsWith('"') || val.startsWith("'")) return false;
  return /^[^:]+:(\s|$)/.test(val);
}

function parseSimpleYaml(yaml: string): any {
  const lines = yaml.split("\n");

  type Frame = { indent: number; parent: any; key: string | number };
  const rootHolder: { root: any } = { root: {} };
  const stack: Frame[] = [{ indent: -1, parent: rootHolder, key: "root" }];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const frame = stack[stack.length - 1];
    const container = frame.parent[frame.key];

    if (content.startsWith("- ") || content === "-") {
      const val = content === "-" ? "" : content.slice(2).trim();

      let holder: any = frame.parent;
      let targetKey: string | number = frame.key;
      let target = container;
      if (!Array.isArray(target) && target && typeof target === "object") {
        const keys = Object.keys(target);
        const lastKey = keys[keys.length - 1];
        if (lastKey !== undefined) {
          holder = target;
          targetKey = lastKey;
          target = target[lastKey];
        }
      }
      if (!Array.isArray(target)) {
        target = [];
        holder[targetKey] = target;
      }

      if (val !== "" && isMappingEntry(val)) {
        const item: any = {};
        target.push(item);
        const colonIdx = val.indexOf(":");
        const key = val.slice(0, colonIdx).trim();
        const itemVal = val.slice(colonIdx + 1).trim();
        if (itemVal === "" || itemVal === "|" || itemVal === ">") {
          item[key] = {};
          stack.push({ indent, parent: item, key });
        } else {
          item[key] = parseYamlValue(itemVal);
        }
        stack.push({ indent, parent: target, key: target.length - 1 });
      } else {
        target.push(parseYamlValue(val));
      }
    } else {
      const colonIdx = content.indexOf(":");
      if (colonIdx === -1) continue;
      const key = content.slice(0, colonIdx).trim();
      const val = content.slice(colonIdx + 1).trim();
      if (val === "" || val === "|" || val === ">") {
        container[key] = {};
        stack.push({ indent, parent: container, key });
      } else {
        container[key] = parseYamlValue(val);
      }
    }
  }
  return rootHolder.root;
}

function parseYamlValue(val: string): any {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "~") return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

const YamlToXml = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [rootTag, setRootTag] = useState("root");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) return;
    try {
      const parsed = parseSimpleYaml(input);
      setOutput(objectToXmlDocument(parsed, rootTag));
    } catch (e: any) {
      setError(e.message || "Failed to parse YAML");
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
          <FileCode2 className="mr-2 h-4 w-4" />
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

      {error && <NAlert type={AlertTypes.ERROR} title="Invalid YAML" message={error} className="mb-4" />}

      <div className="grid gap-4 lg:grid-cols-2">
        <NTextarea
          label="YAML Input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"name: Alice\nage: 30\nhobbies:\n  - reading\n  - coding"}
          textareaClassName="h-[300px] resize-none font-mono text-sm"
        />
        <XmlMonacoEditor label="XML Output" value={output} readOnly language="xml" />
      </div>
    </div>
  );
};

export default YamlToXml;

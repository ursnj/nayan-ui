"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

function isMappingEntry(val: string): boolean {
  if (val.startsWith('"') || val.startsWith("'")) return false;
  return /^[^:]+:(\s|$)/.test(val);
}

function parseSimpleYaml(yaml: string): any {
  const lines = yaml.split("\n");

  // Frames reference a container indirectly via (parent, key) so an empty
  // object placeholder can be converted into an array in place once we
  // discover its first child is a "- " list item — this is what lets both
  // `key:\n  - item` (indented) and `key:\n- item` (flush) list styles work,
  // and lets the YAML document root itself be a top-level sequence.
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

      // A list can appear flush with its key (`key:\n- item`) instead of
      // indented under it (`key:\n  - item`); in the flush case `container`
      // resolves to the *mapping* that owns the key, not the key's own
      // (still-empty) placeholder, so fall back to that mapping's last key.
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

const YamlToJson = () => {
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = parseSimpleYaml(input);
      return { output: JSON.stringify(parsed, null, 2), error: "" };
    } catch (e: any) {
      return { output: "", error: e.message || "Failed to parse YAML" };
    }
  }, [input]);

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

      <NTextarea
        label="YAML Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="name: Alice&#10;age: 30&#10;hobbies:&#10;  - reading&#10;  - coding"
        textareaClassName="h-[250px] resize-none font-mono text-sm"
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

export default YamlToJson;

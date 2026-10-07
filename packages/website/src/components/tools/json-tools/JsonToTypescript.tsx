"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, NInput, showToast } from "@nayan-ui/react";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function isPlainObject(v: Json): v is { [k: string]: Json } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function toPascalCase(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!cleaned) return "Item";
  const pascal = cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return /^[0-9]/.test(pascal) ? `_${pascal}` : pascal;
}

function primitiveType(v: Json): string {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return t;
  return "unknown";
}

interface GenCtx {
  usedNames: Set<string>;
  order: string[];
  bodies: Map<string, string>;
}

function uniqueName(ctx: GenCtx, base: string): string {
  let name = base || "Item";
  let i = 2;
  while (ctx.usedNames.has(name)) {
    name = `${base}${i++}`;
  }
  ctx.usedNames.add(name);
  return name;
}

// Resolves the TS type for a field/slot observed across one or more sample
// values (several samples happen when merging an array of objects, or when
// the same key appears in multiple merged parent objects).
function typeOfSamples(ctx: GenCtx, values: Json[], nameHint: string): string {
  if (values.length === 0) return "unknown";

  if (values.every(isPlainObject)) {
    return buildInterface(ctx, values as Record<string, Json>[], nameHint);
  }

  if (values.every((v) => Array.isArray(v))) {
    const elements = (values as Json[][]).flat();
    if (elements.length === 0) return "unknown[]";
    const elementType = typeOfSamples(ctx, elements, nameHint);
    return elementType.includes("|") ? `(${elementType})[]` : `${elementType}[]`;
  }

  // Mixed kinds for the same slot (e.g. sometimes a number, sometimes an
  // object) — union each distinct kind individually.
  const parts = new Set<string>();
  for (const v of values) {
    if (Array.isArray(v)) {
      parts.add(v.length === 0 ? "unknown[]" : `${typeOfSamples(ctx, v, nameHint)}[]`);
    } else if (isPlainObject(v)) {
      parts.add(buildInterface(ctx, [v], nameHint));
    } else {
      parts.add(primitiveType(v));
    }
  }
  return parts.size === 1 ? [...parts][0] : [...parts].join(" | ");
}

function buildInterface(ctx: GenCtx, samples: Record<string, Json>[], nameHint: string): string {
  const keys = new Set<string>();
  for (const s of samples) for (const k of Object.keys(s)) keys.add(k);
  if (keys.size === 0) return "Record<string, unknown>";

  const name = uniqueName(ctx, toPascalCase(nameHint));
  const lines: string[] = [];
  for (const key of keys) {
    const fieldSamples: Json[] = [];
    let presentCount = 0;
    for (const s of samples) {
      if (Object.prototype.hasOwnProperty.call(s, key)) {
        presentCount++;
        fieldSamples.push(s[key]);
      }
    }
    const optional = presentCount < samples.length;
    const fieldType = typeOfSamples(ctx, fieldSamples, key);
    const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    lines.push(`  ${safeKey}${optional ? "?" : ""}: ${fieldType};`);
  }

  ctx.order.push(name);
  ctx.bodies.set(name, `interface ${name} {\n${lines.join("\n")}\n}`);
  return name;
}

function jsonToTypeScript(root: Json, rootName: string): string {
  const ctx: GenCtx = { usedNames: new Set(), order: [], bodies: new Map() };
  const pascalRoot = toPascalCase(rootName || "RootObject");

  let rootIsNamedInterface = false;
  let rootType: string;

  if (isPlainObject(root)) {
    rootType = buildInterface(ctx, [root], pascalRoot);
    rootIsNamedInterface = true;
  } else if (Array.isArray(root)) {
    // Reserve the root type-alias name up front so a nested interface that
    // would otherwise also want this name (e.g. root array named "Item"
    // generating an element interface also named "Item") gets disambiguated
    // instead of colliding with `type <pascalRoot> = ...` below.
    ctx.usedNames.add(pascalRoot);
    if (root.length === 0) {
      rootType = "unknown[]";
    } else {
      const elementType = typeOfSamples(ctx, root, pascalRoot);
      rootType = elementType.includes("|") ? `(${elementType})[]` : `${elementType}[]`;
    }
  } else {
    rootType = primitiveType(root);
  }

  const interfaceBlocks = ctx.order.map((n) => ctx.bodies.get(n)!);
  if (rootIsNamedInterface) {
    return interfaceBlocks.join("\n\n");
  }
  return [...interfaceBlocks, `type ${pascalRoot} = ${rootType};`].join("\n\n");
}

const JsonToTypescript = () => {
  const [input, setInput] = useState("");
  const [rootName, setRootName] = useState("RootObject");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      return { output: jsonToTypeScript(parsed, rootName), error: "" };
    } catch (e: any) {
      return { output: "", error: e.message || "Invalid JSON" };
    }
  }, [input, rootName]);

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
            Copy TypeScript
          </NButton>
        )}
        <NButton isOutline onClick={() => setInput("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NInput
        label="Root interface name"
        className="mb-4 max-w-60"
        value={rootName}
        onChange={(e) => setRootName(e.target.value || "RootObject")}
      />

      <NTextarea
        label="JSON Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"id": 1, "name": "Alice", "tags": ["admin", "user"]}'
        textareaClassName="h-[250px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">TypeScript Output</label>
          <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default JsonToTypescript;

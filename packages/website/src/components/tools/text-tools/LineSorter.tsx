"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, NSelect, NCheck, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const SORT_OPTIONS: ReactSelectOption[] = [
  { label: "Alphabetical (A–Z)", value: "az" },
  { label: "Alphabetical (Z–A)", value: "za" },
  { label: "Numeric (ascending)", value: "num-asc" },
  { label: "Numeric (descending)", value: "num-desc" },
  { label: "By line length (short first)", value: "len-asc" },
  { label: "By line length (long first)", value: "len-desc" },
  { label: "Randomize", value: "random" },
];

const LineSorter = () => {
  const [input, setInput] = useState("");
  const [sortMode, setSortMode] = useState<ReactSelectOption>(SORT_OPTIONS[0]);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [trimLines, setTrimLines] = useState(false);

  const output = useMemo(() => {
    if (!input) return "";
    let lines = input.split("\n");
    if (trimLines) lines = lines.map((l) => l.trim());
    if (removeEmpty) lines = lines.filter((l) => l.trim() !== "");
    if (removeDuplicates) lines = [...new Set(lines)];

    const mode = sortMode.value;
    if (mode === "az") lines.sort((a, b) => a.localeCompare(b));
    else if (mode === "za") lines.sort((a, b) => b.localeCompare(a));
    else if (mode === "num-asc") lines.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
    else if (mode === "num-desc") lines.sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0));
    else if (mode === "len-asc") lines.sort((a, b) => a.length - b.length);
    else if (mode === "len-desc") lines.sort((a, b) => b.length - a.length);
    else if (mode === "random") {
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
    }

    return lines.join("\n");
  }, [input, sortMode, removeDuplicates, removeEmpty, trimLines]);

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
            Copy Result
          </NButton>
        )}
        <NButton isOutline onClick={() => setInput("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NSelect
        label="Sort mode"
        className="mb-4 max-w-72"
        value={sortMode}
        options={SORT_OPTIONS}
        onChange={(v) => { if (v) setSortMode(v); }}
        isSearchable={false}
      />

      <div className="mb-4 flex flex-wrap gap-6">
        <NCheck label="Remove duplicates" checked={removeDuplicates} onChange={setRemoveDuplicates} />
        <NCheck label="Remove empty lines" checked={removeEmpty} onChange={setRemoveEmpty} />
        <NCheck label="Trim whitespace" checked={trimLines} onChange={setTrimLines} />
      </div>

      <NTextarea
        label="Input Lines"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter lines to sort (one per line)..."
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">Sorted Output ({output.split("\n").length} lines)</label>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default LineSorter;

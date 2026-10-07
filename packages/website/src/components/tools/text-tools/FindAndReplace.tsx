"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, Replace } from "lucide-react";
import { NButton, NInput, NTextarea, NCard, NCheck, showToast } from "@nayan-ui/react";

const FindAndReplace = () => {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const { result, count } = useMemo(() => {
    if (!text || !find) return { result: text, count: 0 };
    try {
      const flags = caseSensitive ? "g" : "gi";
      const regex = useRegex ? new RegExp(find, flags) : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      let c = 0;
      const r = text.replace(regex, () => {
        c++;
        return replace;
      });
      return { result: r, count: c };
    } catch {
      return { result: text, count: 0 };
    }
  }, [text, find, replace, caseSensitive, useRegex]);

  const copy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    showToast("Copied to clipboard");
  }, [result]);

  const applyResult = useCallback(() => {
    setText(result);
    setFind("");
    setReplace("");
  }, [result]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {find && count > 0 && (
          <NButton onClick={applyResult}>
            <Replace className="mr-2 h-4 w-4" />
            Apply ({count} replacement{count !== 1 ? "s" : ""})
          </NButton>
        )}
        {result && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy Result
          </NButton>
        )}
        <NButton isOutline onClick={() => { setText(""); setFind(""); setReplace(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <NInput label="Find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search text..." />
        <NInput label="Replace with" value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Replacement text..." />
      </div>

      <div className="mb-4 flex gap-6">
        <NCheck label="Case sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
        <NCheck label="Use regex" checked={useRegex} onChange={setUseRegex} />
      </div>

      <NTextarea
        label="Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here..."
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {find && text && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">Preview ({count} match{count !== 1 ? "es" : ""})</label>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {result}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default FindAndReplace;

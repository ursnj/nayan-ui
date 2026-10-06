"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Trash2, Undo2 } from "lucide-react";
import { NButton, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const reverseChars = (s: string) => Array.from(s).reverse().join("");

const MODES = [
  { label: "Reverse Text", fn: reverseChars },
  { label: "Reverse Words", fn: (s: string) => s.split(/\s+/).reverse().join(" ") },
  { label: "Reverse Lines", fn: (s: string) => s.split("\n").reverse().join("\n") },
  { label: "Reverse Each Word", fn: (s: string) => s.split(/\s+/).map(reverseChars).join(" ") },
];

const TextReverser = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <NButton key={m.label} isOutline onClick={() => setOutput(m.fn(input))}>
            <Undo2 className="mr-2 h-4 w-4" />
            {m.label}
          </NButton>
        ))}
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => {
            setInput("");
            setOutput("");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label="Input Text"
          value={input}
          onChange={setInput}
          height="500px"
        />
        <MonacoEditor
          label="Reversed Output"
          value={output}
          readOnly
          height="500px"
        />
      </div>
    </div>
  );
};

export default TextReverser;

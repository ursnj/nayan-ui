"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Lock, LockOpen, Trash2 } from "lucide-react";
import { NButton, NSlider, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const caesarShift = (text: string, shift: number): string => {
  const n = ((shift % 26) + 26) % 26;
  if (n === 0) return text;
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= "Z" ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + n) % 26) + base);
  });
};

const Rot13CaesarCipher = () => {
  const [input, setInput] = useState("");
  const [shift, setShift] = useState(13);
  const [output, setOutput] = useState("");

  const encode = useCallback(() => {
    setOutput(caesarShift(input, shift));
  }, [input, shift]);

  const decode = useCallback(() => {
    setOutput(caesarShift(input, -shift));
  }, [input, shift]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <NSlider
        label="Shift amount"
        min={1}
        max={25}
        value={shift}
        onChange={setShift}
        output={(v) => (v === 13 ? `${v} (ROT13)` : String(v))}
      />

      <div className="mb-4 mt-4 flex flex-wrap items-center gap-3">
        <NButton onClick={encode}>
          <Lock className="mr-2 h-4 w-4" />
          Encode
        </NButton>
        <NButton isOutline onClick={decode}>
          <LockOpen className="mr-2 h-4 w-4" />
          Decode
        </NButton>
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
        <MonacoEditor label="Input Text" value={input} onChange={setInput} height="500px" />
        <MonacoEditor label="Output" value={output} readOnly height="500px" />
      </div>
    </div>
  );
};

export default Rot13CaesarCipher;

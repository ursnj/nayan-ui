"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Trash2, ArrowDownUp } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

const Base64EncoderDecoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");

  const process = useCallback(() => {
    setError("");
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch {
      setError(mode === "decode" ? "Invalid Base64 string" : "Encoding failed");
      setOutput("");
    }
  }, [input, mode]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const swap = useCallback(() => {
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    if (output) setInput(output);
    setOutput("");
    setError("");
  }, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={process}>
          {mode === "encode" ? "Encode" : "Decode"}
        </NButton>
        <NButton isOutline onClick={swap}>
          <ArrowDownUp className="mr-2 h-4 w-4" />
          {mode === "encode" ? "Switch to Decode" : "Switch to Encode"}
        </NButton>
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton isOutline onClick={() => { setInput(""); setOutput(""); setError(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label={mode === "encode" ? "Plain Text" : "Base64 String"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {output && (
        <NCard className="mt-4 p-4">
          <label className="mb-1.5 block text-sm font-medium">{mode === "encode" ? "Base64 Output" : "Decoded Text"}</label>
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default Base64EncoderDecoder;

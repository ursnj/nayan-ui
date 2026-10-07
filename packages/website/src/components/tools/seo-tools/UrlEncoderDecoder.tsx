"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Trash2, ArrowDownUp } from "lucide-react";
import { NButton, NCard, NTextarea, showToast } from "@nayan-ui/react";

const UrlEncoderDecoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");

  const encode = useCallback(() => {
    setError("");
    try {
      setOutput(encodeURIComponent(input));
      setMode("encode");
    } catch (err: any) {
      setError("Failed to encode: " + err.message);
    }
  }, [input]);

  const encodeUri = useCallback(() => {
    setError("");
    try {
      setOutput(encodeURI(input));
      setMode("encode");
    } catch (err: any) {
      setError("Failed to encode: " + err.message);
    }
  }, [input]);

  const decode = useCallback(() => {
    setError("");
    try {
      setOutput(decodeURIComponent(input));
      setMode("decode");
    } catch (err: any) {
      setError("Failed to decode: " + err.message);
    }
  }, [input]);

  const decodeUri = useCallback(() => {
    setError("");
    try {
      setOutput(decodeURI(input));
      setMode("decode");
    } catch (err: any) {
      setError("Failed to decode: " + err.message);
    }
  }, [input]);

  const swap = useCallback(() => {
    setInput(output);
    setOutput("");
    setError("");
  }, [output]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard
      .writeText(output)
      .then(() => showToast("Copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [output]);

  const clear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  return (
    <div>
      <NTextarea
        label="Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a URL or text to encode/decode..."
        textareaClassName="h-[150px] resize-none font-mono text-sm"
      />

      <div className="mt-6 mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={encode}>
          Encode Component
        </NButton>
        <NButton isOutline onClick={encodeUri}>
          Encode URI
        </NButton>
        <NButton onClick={decode}>
          Decode Component
        </NButton>
        <NButton isOutline onClick={decodeUri}>
          Decode URI
        </NButton>
        {output && (
          <>
            <NButton isOutline onClick={swap}>
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Swap
            </NButton>
            <NButton isOutline onClick={copy}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy
            </NButton>
          </>
        )}
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {error && (
        <NCard className="mb-6 p-3 text-sm text-danger">{error}</NCard>
      )}

      {output && (
        <NCard className="p-4">
          <label className="mb-1.5 block text-sm font-medium">
            {mode === "encode" ? "Encoded" : "Decoded"} Result
          </label>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default UrlEncoderDecoder;

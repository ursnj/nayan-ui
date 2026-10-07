"use client";

import { useCallback, useState } from "react";
import { Download, Sheet, Trash2 } from "lucide-react";
import { NButton, NAlert, AlertTypes } from "@nayan-ui/react";
import JsonMonacoEditor from "./JsonMonacoEditor";

const JsonToExcel = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [errorTitle, setErrorTitle] = useState("Invalid JSON");
  const [processing, setProcessing] = useState(false);

  const convert = useCallback(async () => {
    setError("");
    if (!input.trim()) return;
    try {
      JSON.parse(input);
    } catch (e: any) {
      setErrorTitle("Invalid JSON");
      setError(e.message || "Invalid JSON");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/json-tools/json-to-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: input,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error);
      }
      setResult(await res.blob());
    } catch (e: any) {
      setErrorTitle("Conversion Failed");
      setError(e.message || "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [input]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert} isLoading={processing} loadingText="Converting...">
          <Sheet className="mr-2 h-4 w-4" />
          Convert to Excel
        </NButton>
        {result && (
          <NButton isOutline onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => {
            setInput("");
            setResult(null);
            setError("");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {error && (
        <NAlert type={AlertTypes.ERROR} title={errorTitle} message={error} className="mb-4" />
      )}

      <JsonMonacoEditor
        label="Input JSON"
        value={input}
        onChange={setInput}
      />
    </div>
  );
};

export default JsonToExcel;

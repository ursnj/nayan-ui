"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Trash2, Upload, Wrench } from "lucide-react";
import { NButton, NCard } from "@nayan-ui/react";

const RepairPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError("");
    setPageCount(null);
  }, []);

  const repair = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/repair", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Repair failed" }));
        setError(data.error);
        return;
      }
      const count = res.headers.get("X-Page-Count");
      if (count) setPageCount(parseInt(count, 10));
      setResult(await res.blob());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Repair failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repaired-${file?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, file]);

  return (
    <div>
      {!file ? (
        <NCard
          className={`mb-6 flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 transition-colors ${dragging ? "border-accent" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f && (f.type === "application/pdf" || f.name.endsWith(".pdf"))) handleFile(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">Drop a PDF file here or click to upload</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </NCard>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {result && pageCount != null && (
            <p className="mb-4 text-sm text-green-600">✓ Repaired successfully — {pageCount} pages recovered</p>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={repair} isLoading={processing} loadingText="Repairing…">
              <Wrench className="mr-2 h-4 w-4" />
              Repair PDF
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFile(null); setResult(null); setError(""); setPageCount(null); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default RepairPdf;

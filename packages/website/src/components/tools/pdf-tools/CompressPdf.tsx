"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileDown, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NBadge, showToast } from "@nayan-ui/react";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const CompressPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setOriginalSize(f.size);
    setResult(null);
    setCompressedSize(0);
  }, []);

  const compress = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/compress", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Compression failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
      setCompressedSize(blob.size);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Compression failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed-${file?.name || "document.pdf"}`;
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <NBadge size="sm">{formatSize(originalSize)}</NBadge>
              {compressedSize > 0 && (
                <>
                  <span className="text-xs text-muted">→</span>
                  <NBadge size="sm" color="success">{formatSize(compressedSize)}</NBadge>
                  <NBadge size="sm" color="accent">
                    {Math.round((1 - compressedSize / originalSize) * 100)}% saved
                  </NBadge>
                </>
              )}
            </div>
          </NCard>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={compress} isLoading={processing} loadingText="Compressing…">
              <FileDown className="mr-2 h-4 w-4" />
              Compress PDF
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFile(null); setResult(null); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CompressPdf;

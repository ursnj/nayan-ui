"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Images, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NBadge, showToast } from "@nayan-ui/react";

const ExtractImagesFromPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob; count: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const extract = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/extract-images", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Image extraction failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const count = Number(res.headers.get("X-Image-Count") || 0);
      setResult({ blob, count });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Image extraction failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.[^.]+$/, "") || "document"}-images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, file]);

  const clear = useCallback(() => {
    setFile(null);
    setResult(null);
  }, []);

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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <NBadge size="sm">{(file.size / 1024).toFixed(1)} KB</NBadge>
              {result && <NBadge size="sm" color="success">{result.count} image{result.count === 1 ? "" : "s"} found</NBadge>}
            </div>
          </NCard>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={extract} isLoading={processing} loadingText="Extracting…">
              <Images className="mr-2 h-4 w-4" />
              Extract Images
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </NButton>
            )}
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default ExtractImagesFromPdf;

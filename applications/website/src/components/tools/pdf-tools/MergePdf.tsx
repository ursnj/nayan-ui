"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Merge, Trash2, Upload, GripVertical } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

const MergePdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const all = Array.from(fileList);
    const pdfs = all.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfs.length < all.length) {
      showToast(`Skipped ${all.length - pdfs.length} non-PDF file(s)`);
    }
    if (pdfs.length > 0) {
      setFiles((prev) => [...prev, ...pdfs]);
      setResult(null);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  const reorderFile = useCallback((from: number, to: number) => {
    if (from === to) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setResult(null);
  }, []);

  const merge = useCallback(async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/pdf-tools/merge", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Merge failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setProcessing(false);
    }
  }, [files]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div>
      <NCard
        className={`mb-6 flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 transition-colors ${dragging ? "border-accent" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
        <p className="text-sm text-muted">Drop PDF files here or click to upload</p>
        <p className="text-xs text-muted">Select multiple PDF files to merge</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </NCard>

      {files.length > 0 && (
        <>
          <div className="mb-4 space-y-2">
            {files.map((file, i) => (
              <NCard
                key={i}
                className="flex items-center gap-3 p-3"
                draggable
                onDragStart={() => { dragIndexRef.current = i; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndexRef.current !== null) reorderFile(dragIndexRef.current, i);
                  dragIndexRef.current = null;
                }}
              >
                <GripVertical className="h-4 w-4 cursor-grab text-muted" aria-hidden="true" />
                <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => removeFile(i)} className="text-muted hover:text-danger" aria-label={`Remove ${file.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </NCard>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={merge} isLoading={processing} loadingText="Merging…" disabled={files.length < 2}>
              <Merge className="mr-2 h-4 w-4" />
              Merge PDFs
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFiles([]); setResult(null); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default MergePdf;

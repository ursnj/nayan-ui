"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileUp, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const ORIENTATION_OPTIONS: ReactSelectOption[] = [
  { label: "Portrait", value: "portrait" },
  { label: "Landscape", value: "landscape" },
];

const FIT_OPTIONS: ReactSelectOption[] = [
  { label: "Contain (fit within page)", value: "contain" },
  { label: "Fill (stretch to page)", value: "fill" },
];

const ImageToPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [orientation, setOrientation] = useState<ReactSelectOption>(ORIENTATION_OPTIONS[0]);
  const [fit, setFit] = useState<ReactSelectOption>(FIT_OPTIONS[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const all = Array.from(fileList);
    const images = all.filter((f) => f.type.startsWith("image/"));
    if (images.length < all.length) {
      showToast(`Skipped ${all.length - images.length} non-image file(s)`);
    }
    if (images.length > 0) {
      setFiles((prev) => [...prev, ...images]);
      setResult(null);
    }
  }, []);

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("orientation", orientation.value);
      form.append("fit", fit.value);
      const res = await fetch("/api/pdf-tools/image-to-pdf", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [files, orientation, fit]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.pdf";
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
        <p className="text-sm text-muted">Drop images here or click to upload</p>
        <p className="text-xs text-muted">JPG, PNG, WebP — each image becomes a PDF page</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </NCard>

      {files.length > 0 && (
        <>
          <div className="mb-4 space-y-2">
            {files.map((file, i) => (
              <NCard key={i} className="flex items-center gap-3 p-3">
                <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  onClick={() => { setFiles((prev) => prev.filter((_, idx) => idx !== i)); setResult(null); }}
                  className="text-muted hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </NCard>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NSelect
              label="Orientation"
              className="mb-0"
              value={orientation}
              options={ORIENTATION_OPTIONS}
              onChange={(v) => { if (v) setOrientation(v); }}
              isSearchable={false}
            />
            <NSelect
              label="Image fit"
              className="mb-0"
              value={fit}
              options={FIT_OPTIONS}
              onChange={(v) => { if (v) setFit(v); }}
              isSearchable={false}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={convert} isLoading={processing} loadingText="Converting…">
              <FileUp className="mr-2 h-4 w-4" />
              Convert to PDF
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

export default ImageToPdf;

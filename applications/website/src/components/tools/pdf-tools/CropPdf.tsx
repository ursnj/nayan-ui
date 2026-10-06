"use client";

import { useCallback, useRef, useState } from "react";
import { Crop, Download, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const PAGE_OPTIONS: ReactSelectOption[] = [{ label: "All Pages", value: "all" }];

const CropPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [top, setTop] = useState("10");
  const [right, setRight] = useState("10");
  const [bottom, setBottom] = useState("10");
  const [left, setLeft] = useState("10");
  const [applyTo, setApplyTo] = useState<ReactSelectOption>(PAGE_OPTIONS[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const crop = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("top", top);
      form.append("right", right);
      form.append("bottom", bottom);
      form.append("left", left);
      form.append("applyTo", applyTo.value);
      const res = await fetch("/api/pdf-tools/crop", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Cropping failed" }));
        throw new Error(data.error);
      }
      setResult(await res.blob());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Cropping failed");
    } finally {
      setProcessing(false);
    }
  }, [file, top, right, bottom, left, applyTo]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cropped-${file?.name || "document.pdf"}`;
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

          <div className="mb-4 grid grid-cols-2 gap-3">
            <NInput type="number" label="Top (%)" className="mb-0" value={top} onChange={(e) => setTop(e.target.value)} min="0" max="50" />
            <NInput type="number" label="Right (%)" className="mb-0" value={right} onChange={(e) => setRight(e.target.value)} min="0" max="50" />
            <NInput type="number" label="Bottom (%)" className="mb-0" value={bottom} onChange={(e) => setBottom(e.target.value)} min="0" max="50" />
            <NInput type="number" label="Left (%)" className="mb-0" value={left} onChange={(e) => setLeft(e.target.value)} min="0" max="50" />
          </div>

          <NSelect
            label="Apply to"
            value={applyTo}
            onChange={(val) => { if (val) setApplyTo(val); }}
            options={PAGE_OPTIONS}
            className="mb-4 max-w-52"
            isSearchable={false}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={crop} isLoading={processing} loadingText="Cropping…">
              <Crop className="mr-2 h-4 w-4" />
              Crop PDF
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

export default CropPdf;

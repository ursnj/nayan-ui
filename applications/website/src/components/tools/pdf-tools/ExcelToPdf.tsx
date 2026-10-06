"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Sheet, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

const ACCEPT = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ExcelToPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const convert = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/excel-to-pdf", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error);
      }
      setResult(await res.blob());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, "") || "spreadsheet") + ".pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [result, file]);

  const isValid = (f: File) => /\.(xlsx?|XLS|XLSX)$/.test(f.name);

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
            if (f && isValid(f)) handleFile(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">Drop an Excel file (.xls, .xlsx) here or click to upload</p>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </NCard>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={convert} isLoading={processing} loadingText="Converting…">
              <Sheet className="mr-2 h-4 w-4" />
              Convert to PDF
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

export default ExcelToPdf;

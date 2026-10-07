"use client";

import { useCallback, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { NButton, NCard, NBadge, showToast } from "@nayan-ui/react";

interface PdfInfoData {
  pageCount: number;
  fileSize: number;
  pdfVersion: string | null;
  pageWidth: number;
  pageHeight: number;
  mixedPageSizes: boolean;
  encrypted: boolean;
  title: string | null;
  author: string | null;
  producer: string | null;
  wordCount: number;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-default/20 py-2 text-sm last:border-0">
    <span className="text-muted">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const PdfInfo = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const analyze = useCallback(async (f: File) => {
    setFile(f);
    setInfo(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/pdf-tools/info-stats", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to analyze PDF" }));
        throw new Error(data.error);
      }
      const data = (await res.json()) as PdfInfoData;
      setInfo(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to analyze PDF");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setInfo(null);
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
            if (f && (f.type === "application/pdf" || f.name.endsWith(".pdf"))) analyze(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">Drop a PDF file here or click to upload</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <NBadge size="sm">{formatSize(file.size)}</NBadge>
              {info?.encrypted && <NBadge size="sm" color="warning">Encrypted</NBadge>}
            </div>
          </NCard>

          {loading && <p className="mb-4 text-sm text-muted">Analyzing PDF…</p>}

          {info && (
            <NCard className="mb-5 p-4">
              <Row label="Page count" value={String(info.pageCount)} />
              <Row label="File size" value={formatSize(info.fileSize)} />
              <Row label="PDF version" value={info.pdfVersion ? `1.${info.pdfVersion.split(".")[1]}` : "Unknown"} />
              <Row
                label="Page dimensions"
                value={`${info.pageWidth} × ${info.pageHeight} pt${info.mixedPageSizes ? " (varies by page)" : ""}`}
              />
              <Row label="Encrypted / protected" value={info.encrypted ? "Yes" : "No"} />
              <Row label="Title" value={info.title || "—"} />
              <Row label="Author" value={info.author || "—"} />
              <Row label="Producer" value={info.producer || "—"} />
              <Row label="Approximate word count" value={info.wordCount.toLocaleString()} />
            </NCard>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
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

export default PdfInfo;

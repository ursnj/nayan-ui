"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Hash, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const POSITION_OPTIONS: ReactSelectOption[] = [
  { label: "Bottom center", value: "bottom-center" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Bottom right", value: "bottom-right" },
  { label: "Top center", value: "top-center" },
  { label: "Top left", value: "top-left" },
  { label: "Top right", value: "top-right" },
];

const PageNumbersPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("Page {current} of {total}");
  const [position, setPosition] = useState<ReactSelectOption>(POSITION_OPTIONS[0]);
  const [fontSize, setFontSize] = useState(12);
  const [startFrom, setStartFrom] = useState(1);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const addNumbers = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("format", format);
      form.append("position", position.value);
      form.append("fontSize", String(fontSize));
      form.append("startFrom", String(startFrom));
      const res = await fetch("/api/pdf-tools/page-numbers", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add page numbers");
    } finally {
      setProcessing(false);
    }
  }, [file, format, position, fontSize, startFrom]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numbered-${file?.name || "document.pdf"}`;
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          </NCard>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NInput
              label="Number format"
              className="mb-0"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Page {current} of {total}"
            />
            <NSelect
              label="Position"
              className="mb-0"
              value={position}
              options={POSITION_OPTIONS}
              onChange={(v) => { if (v) setPosition(v); }}
              isSearchable={false}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NInput
              type="number"
              label="Font size"
              className="mb-0"
              value={String(fontSize)}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="6"
              max="72"
            />
            <NInput
              type="number"
              label="Start numbering at"
              className="mb-0"
              value={String(startFrom)}
              onChange={(e) => setStartFrom(Number(e.target.value))}
              min="1"
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={addNumbers} isLoading={processing} loadingText="Adding…">
              <Hash className="mr-2 h-4 w-4" />
              Add Page Numbers
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

export default PageNumbersPdf;

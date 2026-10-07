"use client";

import { useCallback, useRef, useState } from "react";
import { Download, RotateCw, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const ANGLE_OPTIONS: ReactSelectOption[] = [
  { label: "90° clockwise", value: "90" },
  { label: "180°", value: "180" },
  { label: "270° clockwise", value: "270" },
];

const RotatePdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<ReactSelectOption>(ANGLE_OPTIONS[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const rotate = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("angle", angle.value);
      form.append("pages", "all");
      const res = await fetch("/api/pdf-tools/rotate", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Rotation failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rotation failed");
    } finally {
      setProcessing(false);
    }
  }, [file, angle]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotated-${file?.name || "document.pdf"}`;
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

          <NSelect
            label="Rotation angle"
            className="mb-4 max-w-52"
            value={angle}
            options={ANGLE_OPTIONS}
            onChange={(v) => { if (v) setAngle(v); }}
            isSearchable={false}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={rotate} isLoading={processing} loadingText="Rotating…">
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate PDF
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

export default RotatePdf;

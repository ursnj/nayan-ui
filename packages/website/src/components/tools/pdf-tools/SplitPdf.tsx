"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Scissors, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";

const SplitPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("1-3,4-6");
  const [results, setResults] = useState<Blob[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResults([]);
  }, []);

  const split = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("ranges", ranges);
      const res = await fetch("/api/pdf-tools/split", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Split failed" }));
        throw new Error(data.error);
      }

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        setResults([blob]);
      } else {
        const data = await res.json();
        const blobs = data.parts.map((b64: string) => {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return new Blob([bytes], { type: "application/pdf" });
        });
        setResults(blobs);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Split failed");
    } finally {
      setProcessing(false);
    }
  }, [file, ranges]);

  const downloadPart = useCallback((blob: Blob, index: number) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split-part-${index + 1}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </NCard>

          <NInput
            label="Page ranges"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="e.g. 1-3,4-6,7"
            className="mb-4"
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={split} isLoading={processing} loadingText="Splitting…">
              <Scissors className="mr-2 h-4 w-4" />
              Split PDF
            </NButton>
            <NButton isOutline onClick={() => { setFile(null); setResults([]); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((blob, i) => (
                <NCard key={i} className="flex items-center justify-between p-3">
                  <span className="text-sm text-foreground">Part {i + 1}</span>
                  <span className="text-xs text-muted">{(blob.size / 1024).toFixed(1)} KB</span>
                  <NButton isOutline onClick={() => downloadPart(blob, i)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </NButton>
                </NCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SplitPdf;

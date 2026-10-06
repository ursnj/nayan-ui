"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Image, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const FORMAT_OPTIONS: ReactSelectOption[] = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
];

interface PageInfo {
  index: number;
  width: number;
  height: number;
}

const PdfToImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ReactSelectOption>(FORMAT_OPTIONS[0]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setPages([]);
  }, []);

  const analyze = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("format", format.value);
      const res = await fetch("/api/pdf-tools/pdf-to-image", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(data.error);
      }
      const data = await res.json();
      setPages(data.pages);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setProcessing(false);
    }
  }, [file, format]);

  const [downloadingPage, setDownloadingPage] = useState<number | null>(null);

  const downloadPage = useCallback(
    async (pageIndex: number) => {
      if (!file) return;
      setDownloadingPage(pageIndex);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("page", String(pageIndex));
        form.append("format", format.value);
        const res = await fetch("/api/pdf-tools/pdf-to-image", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Failed to render page" }));
          throw new Error(data.error || "Failed to render page");
        }
        const blob = await res.blob();
        const ext = format.value === "jpeg" ? "jpg" : "png";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `page-${pageIndex}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to render page");
      } finally {
        setDownloadingPage(null);
      }
    },
    [file, format],
  );

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
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </NCard>

          <NSelect
            label="Output format"
            className="mb-4 max-w-52"
            value={format}
            options={FORMAT_OPTIONS}
            onChange={(v) => { if (v) setFormat(v); }}
            isSearchable={false}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={analyze} isLoading={processing} loadingText="Analyzing…">
              <Image className="mr-2 h-4 w-4" />
              Extract Pages
            </NButton>
            <NButton isOutline onClick={() => { setFile(null); setPages([]); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          {pages.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <NCard key={page.index} className="p-3">
                  <p className="text-sm font-medium text-foreground">Page {page.index}</p>
                  <p className="text-xs text-muted">{Math.round(page.width)} × {Math.round(page.height)} pts</p>
                  <NButton
                    isOutline
                    className="mt-2 w-full"
                    onClick={() => downloadPage(page.index)}
                    isLoading={downloadingPage === page.index}
                    loadingText="Rendering…"
                    disabled={downloadingPage !== null}
                  >
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

export default PdfToImage;

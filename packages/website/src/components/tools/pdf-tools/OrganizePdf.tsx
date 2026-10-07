"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, GripVertical, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

const OrganizePdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [deleted, setDeleted] = useState<number[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setDeleted([]);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/pdf-tools/info", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const count = data.pageCount as number;
      setPageCount(count);
      setPages(Array.from({ length: count }, (_, i) => i));
    } catch {
      setPageCount(0);
      setPages([]);
      showToast("Could not read this PDF. It may be corrupt or password-protected.");
    }
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setPages((prev) => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setPages((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }, []);

  const deletePage = useCallback((pageNum: number) => {
    setPages((prev) => prev.filter((p) => p !== pageNum));
    setDeleted((prev) => [...prev, pageNum]);
  }, []);

  const organize = useCallback(async () => {
    if (!file || pages.length === 0) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("pageOrder", JSON.stringify(pages));
      form.append("deletedPages", JSON.stringify(deleted));
      const res = await fetch("/api/pdf-tools/organize", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Organization failed" }));
        throw new Error(data.error);
      }
      setResult(await res.blob());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Organization failed");
    } finally {
      setProcessing(false);
    }
  }, [file, pages, deleted]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organized-${file?.name || "document.pdf"}`;
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
            <p className="text-xs text-muted">{pageCount} pages · {(file.size / 1024).toFixed(1)} KB</p>
          </NCard>

          <div className="mb-4 max-h-64 overflow-y-auto rounded border border-border">
            {pages.map((pageNum, idx) => (
              <div key={`${pageNum}-${idx}`} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
                <GripVertical className="h-4 w-4 text-muted" />
                <span className="flex-1 text-sm text-foreground">Page {pageNum + 1}</span>
                <button onClick={() => moveUp(idx)} className="rounded p-1 hover:bg-card" title="Move up">
                  <ArrowUp className="h-3.5 w-3.5 text-muted" />
                </button>
                <button onClick={() => moveDown(idx)} className="rounded p-1 hover:bg-card" title="Move down">
                  <ArrowDown className="h-3.5 w-3.5 text-muted" />
                </button>
                <button onClick={() => deletePage(pageNum)} className="rounded p-1 hover:bg-card" title="Delete page">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={organize} isLoading={processing} loadingText="Organizing…" disabled={pages.length === 0}>
              <GripVertical className="mr-2 h-4 w-4" />
              Organize PDF
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFile(null); setResult(null); setPages([]); setDeleted([]); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizePdf;

"use client";

import { useCallback, useRef, useState } from "react";
import { ClipboardCopy, Download, FileText, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

const PdfToMarkdown = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setMarkdown("");
  }, []);

  const convert = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/pdf-to-markdown", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error);
      }
      const data = await res.json();
      setMarkdown(data.markdown);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const downloadMd = useCallback(() => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, "") || "document") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, file]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(
      () => showToast("Copied to clipboard"),
      () => showToast("Failed to copy to clipboard"),
    );
  }, [markdown]);

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
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </NCard>
      ) : (
        <>
          <NCard className="mb-6 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </NCard>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={convert} isLoading={processing} loadingText="Converting…">
              <FileText className="mr-2 h-4 w-4" />
              Convert to Markdown
            </NButton>
            {markdown && (
              <>
                <NButton isOutline onClick={downloadMd}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .md
                </NButton>
                <NButton isOutline onClick={copy}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy
                </NButton>
              </>
            )}
            <NButton isOutline onClick={() => { setFile(null); setMarkdown(""); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}

      {markdown && (
        <NCard className="p-4">
          <label className="mb-1.5 block text-sm font-medium">Generated Markdown</label>
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
            {markdown}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default PdfToMarkdown;

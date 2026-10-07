"use client";

import { useCallback, useRef, useState } from "react";
import { ClipboardCopy, Download, FileText, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NBadge, NTextarea, showToast } from "@nayan-ui/react";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const PdfToText = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setText("");
  }, []);

  const extract = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pdf-tools/pdf-to-text", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Text extraction failed" }));
        throw new Error(data.error);
      }
      const content = await res.text();
      setText(content);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Text extraction failed");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, [text]);

  const download = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.[^.]+$/, "") || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, file]);

  const clear = useCallback(() => {
    setFile(null);
    setText("");
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <NBadge size="sm">{formatSize(file.size)}</NBadge>
              {text && <NBadge size="sm" color="success">{text.length.toLocaleString()} characters extracted</NBadge>}
            </div>
          </NCard>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={extract} isLoading={processing} loadingText="Extracting…">
              <FileText className="mr-2 h-4 w-4" />
              Extract Text
            </NButton>
            {text && (
              <>
                <NButton isOutline onClick={copy}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy
                </NButton>
                <NButton isOutline onClick={download}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .txt
                </NButton>
              </>
            )}
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          {text && (
            <NTextarea
              label="Extracted Text"
              value={text}
              isReadOnly
              textareaClassName="h-[400px] resize-none font-mono text-sm"
            />
          )}
        </>
      )}
    </div>
  );
};

export default PdfToText;

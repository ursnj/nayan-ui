"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileSignature, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NBadge, NInput, showToast } from "@nayan-ui/react";

interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  encrypted: boolean;
}

const PdfMetadataEditor = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const readMetadata = useCallback(async (f: File) => {
    setFile(f);
    setMeta(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      form.append("action", "read");
      const res = await fetch("/api/pdf-tools/metadata", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to read metadata" }));
        throw new Error(data.error);
      }
      const data = (await res.json()) as Metadata;
      setMeta(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to read metadata");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async () => {
    if (!file || !meta) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("action", "write");
      form.append("title", meta.title);
      form.append("author", meta.author);
      form.append("subject", meta.subject);
      form.append("keywords", meta.keywords);
      const res = await fetch("/api/pdf-tools/metadata", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to save metadata" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, "")}-edited.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Metadata saved — download started");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save metadata");
    } finally {
      setSaving(false);
    }
  }, [file, meta]);

  const clear = useCallback(() => {
    setFile(null);
    setMeta(null);
  }, []);

  const update = (field: keyof Metadata) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeta((prev) => (prev ? { ...prev, [field]: e.target.value } : prev));
  };

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
            if (f && (f.type === "application/pdf" || f.name.endsWith(".pdf"))) readMetadata(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">Drop a PDF file here or click to upload</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readMetadata(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <NBadge size="sm">{(file.size / 1024).toFixed(1)} KB</NBadge>
              {meta?.encrypted && <NBadge size="sm" color="warning">Encrypted</NBadge>}
            </div>
          </NCard>

          {loading && <p className="mb-4 text-sm text-muted">Reading metadata…</p>}

          {meta && (
            <div className="mb-5 space-y-4">
              <NInput label="Title" value={meta.title} onChange={update("title")} placeholder="Document title" />
              <NInput label="Author" value={meta.author} onChange={update("author")} placeholder="Document author" />
              <NInput label="Subject" value={meta.subject} onChange={update("subject")} placeholder="Document subject" />
              <NInput
                label="Keywords (comma-separated)"
                value={meta.keywords}
                onChange={update("keywords")}
                placeholder="keyword1, keyword2, keyword3"
              />
              {(meta.creator || meta.producer || meta.creationDate) && (
                <p className="text-xs text-muted">
                  {meta.creator && <>Creator: {meta.creator} · </>}
                  {meta.producer && <>Producer: {meta.producer} · </>}
                  {meta.creationDate && <>Created: {new Date(meta.creationDate).toLocaleString()}</>}
                </p>
              )}
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={save} isLoading={saving} loadingText="Saving…" disabled={!meta}>
              <Download className="mr-2 h-4 w-4" />
              Save &amp; Download
            </NButton>
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

export default PdfMetadataEditor;

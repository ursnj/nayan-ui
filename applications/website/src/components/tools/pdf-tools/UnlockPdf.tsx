"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Unlock, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput } from "@nayan-ui/react";

const UnlockPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError("");
  }, []);

  const unlock = useCallback(async () => {
    if (!file || !password) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("password", password);
      const res = await fetch("/api/pdf-tools/unlock", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unlock failed" }));
        setError(data.error || "Unlock failed");
        return;
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setProcessing(false);
    }
  }, [file, password]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unlocked-${file?.name || "document.pdf"}`;
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
          <p className="text-sm text-muted">Drop a password-protected PDF here or click to upload</p>
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
            type="password"
            label="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter the PDF password"
            className="mb-4"
          />

          {error && (
            <p className="mb-4 text-sm text-danger">{error}</p>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={unlock} isLoading={processing} loadingText="Unlocking…" disabled={!password}>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock PDF
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFile(null); setResult(null); setError(""); setPassword(""); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default UnlockPdf;

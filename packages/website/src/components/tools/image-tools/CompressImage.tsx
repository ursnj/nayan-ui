"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageDown, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NSlider, NBadge, showToast } from "@nayan-ui/react";

interface FileEntry {
  file: File;
  preview: string;
  compressed?: Blob;
  originalSize: number;
  compressedSize?: number;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const CompressImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const entries: FileEntry[] = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), originalSize: f.size }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((entry) => URL.revokeObjectURL(entry.preview));
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      setFiles((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview));
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compress = useCallback(async () => {
    setProcessing(true);
    try {
      const updated = await Promise.all(
        files.map(async (entry) => {
          const form = new FormData();
          form.append("file", entry.file);
          form.append("quality", String(quality));
          const res = await fetch("/api/image-tools/compress", { method: "POST", body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Compression failed" }));
            throw new Error(data.error || `Server error ${res.status}`);
          }
          const blob = await res.blob();
          return {
            ...entry,
            compressed: blob,
            compressedSize: blob.size,
          };
        }),
      );
      setFiles(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Compression failed");
    } finally {
      setProcessing(false);
    }
  }, [files, quality]);

  const downloadAll = useCallback(() => {
    files.forEach((entry) => {
      if (!entry.compressed) return;
      const url = URL.createObjectURL(entry.compressed);
      const a = document.createElement("a");
      a.href = url;
      const ext = entry.compressed.type === "image/webp" ? "webp" : "jpg";
      a.download = `compressed-${entry.file.name.replace(/\.[^.]+$/, "")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [files]);

  return (
    <div>
      <NCard
        className={`mb-6 flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 transition-colors ${dragging ? "border-accent" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
        <p className="text-sm text-muted">Drop images here or click to upload</p>
        <p className="text-xs text-muted">Supports JPG, PNG, WebP, GIF</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </NCard>

      {files.length > 0 && (
        <>
          <NSlider
            label="Quality"
            min={10}
            max={100}
            value={quality}
            onChange={setQuality}
            output={(v) => `${v}%`}
          />
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={compress} isLoading={processing} loadingText="Compressing…">
              <ImageDown className="mr-2 h-4 w-4" />
              Compress all
            </NButton>
            {files.some((f) => f.compressed) && (
              <NButton isOutline onClick={downloadAll}>
                <Download className="mr-2 h-4 w-4" />
                Download all
              </NButton>
            )}
            <NButton isOutline onClick={clearFiles}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((entry, i) => (
              <NCard key={i} className="overflow-hidden">
                <img
                  src={entry.preview}
                  alt={entry.file.name}
                  className="h-36 w-full object-cover"
                />
                <div className="flex flex-col gap-1 p-3">
                  <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <NBadge size="sm">{formatSize(entry.originalSize)}</NBadge>
                    {entry.compressedSize != null && (
                      <>
                        <span className="text-xs text-muted">→</span>
                        <NBadge size="sm" color="success">{formatSize(entry.compressedSize)}</NBadge>
                        <NBadge size="sm" color="accent">
                          {Math.round((1 - entry.compressedSize / entry.originalSize) * 100)}% saved
                        </NBadge>
                      </>
                    )}
                  </div>
                </div>
              </NCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CompressImage;

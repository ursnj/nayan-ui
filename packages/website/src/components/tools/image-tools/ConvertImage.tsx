"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileImage, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NSelect, NBadge, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

// Keep in sync with SUPPORTED_FORMATS in the /api/image-tools/convert route.
// BMP is intentionally excluded: sharp/libvips cannot encode to BMP.
const FORMATS = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/gif", label: "GIF", ext: "gif" },
];

const FORMAT_OPTIONS: ReactSelectOption[] = FORMATS.map((f) => ({
  label: f.label,
  value: f.value,
}));

interface FileEntry {
  file: File;
  preview: string;
  converted?: Blob;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ConvertImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [targetFormat, setTargetFormat] = useState<ReactSelectOption>(FORMAT_OPTIONS[1]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const entries: FileEntry[] = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
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

  const convert = useCallback(async () => {
    setProcessing(true);
    try {
      const fmt = FORMATS.find((f) => f.value === targetFormat.value);
      const formatKey = fmt?.ext === "jpg" ? "jpeg" : (fmt?.ext || "png");
      const updated = await Promise.all(
        files.map(async (entry) => {
          const form = new FormData();
          form.append("file", entry.file);
          form.append("format", formatKey);
          const res = await fetch("/api/image-tools/convert", { method: "POST", body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Conversion failed" }));
            throw new Error(data.error || `Server error ${res.status}`);
          }
          const blob = await res.blob();
          return { ...entry, converted: blob };
        }),
      );
      setFiles(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [files, targetFormat]);

  const downloadAll = useCallback(() => {
    const fmt = FORMATS.find((f) => f.value === targetFormat.value);
    files.forEach((entry) => {
      if (!entry.converted) return;
      const url = URL.createObjectURL(entry.converted);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entry.file.name.replace(/\.[^.]+$/, "")}.${fmt?.ext ?? "png"}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [files, targetFormat]);

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
          <NSelect
            label="Convert to"
            className="mb-4 max-w-52"
            value={targetFormat}
            options={FORMAT_OPTIONS}
            onChange={(v) => {
              if (v) setTargetFormat(v);
            }}
            isSearchable={false}
          />
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={convert} isLoading={processing} loadingText="Converting…">
              <FileImage className="mr-2 h-4 w-4" />
              Convert all
            </NButton>
            {files.some((f) => f.converted) && (
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
                  <div className="flex items-center gap-2">
                    <NBadge size="sm">{entry.file.type.split("/")[1]?.toUpperCase()}</NBadge>
                    <span className="text-xs text-muted">→</span>
                    <NBadge size="sm" color="accent">{targetFormat.label}</NBadge>
                    {entry.converted && (
                      <NBadge size="sm" color="success">{formatSize(entry.converted.size)}</NBadge>
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

export default ConvertImage;

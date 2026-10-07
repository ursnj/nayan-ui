"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Scaling, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSlider, NCheck, NRadioGroup, NBadge, showToast } from "@nayan-ui/react";
import { useObjectUrl } from "./useObjectUrl";

interface FileEntry {
  file: File;
  preview: string;
  width: number;
  height: number;
  resized?: Blob;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const MODE_OPTIONS = [
  { label: "By pixels", value: "pixels" },
  { label: "By percent", value: "percent" },
];

const ResizedThumb = ({ entry }: { entry: FileEntry }) => {
  const resultUrl = useObjectUrl(entry.resized);
  return (
    <img
      src={resultUrl ?? entry.preview}
      alt={entry.file.name}
      className="h-36 w-full object-cover"
    />
  );
};

const ResizeImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [mode, setMode] = useState("pixels");
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [percent, setPercent] = useState(50);
  const [keepAspect, setKeepAspect] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const entries = await Promise.all(
      imageFiles.map(async (f) => {
        const bitmap = await createImageBitmap(f);
        const entry: FileEntry = {
          file: f,
          preview: URL.createObjectURL(f),
          width: bitmap.width,
          height: bitmap.height,
        };
        bitmap.close();
        return entry;
      }),
    );
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

  const resize = useCallback(async () => {
    setProcessing(true);
    try {
      const updated = await Promise.all(
        files.map(async (entry) => {
          let w: number;
          let h: number;
          if (mode === "percent") {
            w = Math.round(entry.width * (percent / 100));
            h = Math.round(entry.height * (percent / 100));
          } else if (keepAspect) {
            const ratio = entry.width / entry.height;
            w = targetWidth;
            h = Math.round(targetWidth / ratio);
          } else {
            w = targetWidth;
            h = targetHeight;
          }
          const form = new FormData();
          form.append("file", entry.file);
          form.append("width", String(w));
          form.append("height", String(h));
          form.append("fit", keepAspect ? "inside" : "fill");
          const res = await fetch("/api/image-tools/resize", { method: "POST", body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Resize failed" }));
            throw new Error(data.error || `Server error ${res.status}`);
          }
          const blob = await res.blob();
          const newW = Number(res.headers.get("X-Width") || w);
          const newH = Number(res.headers.get("X-Height") || h);
          return { ...entry, resized: blob, width: newW, height: newH };
        }),
      );
      setFiles(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Resize failed");
    } finally {
      setProcessing(false);
    }
  }, [files, mode, targetWidth, targetHeight, percent, keepAspect]);

  const downloadAll = useCallback(() => {
    files.forEach((entry) => {
      if (!entry.resized) return;
      const url = URL.createObjectURL(entry.resized);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized-${entry.file.name}`;
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
          <NRadioGroup
            label="Mode"
            items={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
          />

          {mode === "pixels" ? (
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <NInput
                type="number"
                label="Width"
                value={String(targetWidth)}
                onChange={(e) => setTargetWidth(Number(e.target.value))}
                className="mb-0 w-24"
              />
              <span className="pb-2 text-sm text-muted">×</span>
              <NInput
                type="number"
                label="Height"
                value={String(targetHeight)}
                onChange={(e) => setTargetHeight(Number(e.target.value))}
                disabled={keepAspect}
                className="mb-0 w-24"
              />
              <div className="pb-2">
                <NCheck checked={keepAspect} onChange={setKeepAspect}>
                  Keep ratio
                </NCheck>
              </div>
            </div>
          ) : (
            <NSlider
              label="Scale"
              min={1}
              max={200}
              value={percent}
              onChange={setPercent}
              output={(v) => `${v}%`}
            />
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={resize} isLoading={processing} loadingText="Resizing…">
              <Scaling className="mr-2 h-4 w-4" />
              Resize all
            </NButton>
            {files.some((f) => f.resized) && (
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
                <ResizedThumb entry={entry} />
                <div className="flex flex-col gap-1 p-3">
                  <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                  <div className="flex items-center gap-2">
                    <NBadge size="sm">{entry.width} × {entry.height}px</NBadge>
                    {entry.resized && (
                      <NBadge size="sm" color="success">{formatSize(entry.resized.size)}</NBadge>
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

export default ResizeImage;

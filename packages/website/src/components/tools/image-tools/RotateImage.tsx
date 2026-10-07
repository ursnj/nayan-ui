"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NTooltip, NBadge, showToast } from "@nayan-ui/react";
import { useObjectUrl } from "./useObjectUrl";

interface FileEntry {
  file: File;
  preview: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  result?: Blob;
}

const RotatedThumb = ({ entry }: { entry: FileEntry }) => {
  const resultUrl = useObjectUrl(entry.result);
  return (
    <img
      src={resultUrl ?? entry.preview}
      alt={entry.file.name}
      className="max-h-full max-w-full object-contain transition-transform"
      style={{
        transform: resultUrl
          ? undefined
          : `rotate(${entry.rotation}deg) scaleX(${entry.flipH ? -1 : 1}) scaleY(${entry.flipV ? -1 : 1})`,
      }}
    />
  );
};

const RotateImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const entries: FileEntry[] = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        rotation: 0,
        flipH: false,
        flipV: false,
      }));
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

  const updateEntry = useCallback(
    (index: number, update: Partial<FileEntry>) => {
      setFiles((prev) => prev.map((e, i) => (i === index ? { ...e, ...update } : e)));
    },
    [],
  );

  const applyAll = useCallback(async () => {
    setProcessing(true);
    try {
      const updated = await Promise.all(
        files.map(async (entry) => {
          const form = new FormData();
          form.append("file", entry.file);
          form.append("rotation", String(entry.rotation));
          form.append("flipH", String(entry.flipH));
          form.append("flipV", String(entry.flipV));
          const res = await fetch("/api/image-tools/rotate", { method: "POST", body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Rotate failed" }));
            throw new Error(data.error || `Server error ${res.status}`);
          }
          const blob = await res.blob();
          return { ...entry, result: blob };
        }),
      );
      setFiles(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setProcessing(false);
    }
  }, [files]);

  const downloadAll = useCallback(() => {
    files.forEach((entry) => {
      if (!entry.result) return;
      const url = URL.createObjectURL(entry.result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rotated-${entry.file.name}`;
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
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={applyAll} isLoading={processing} loadingText="Processing…">
              <RotateCw className="mr-2 h-4 w-4" />
              Apply all
            </NButton>
            {files.some((f) => f.result) && (
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
                <div className="flex h-36 items-center justify-center overflow-hidden bg-background">
                  <RotatedThumb entry={entry} />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                    {(entry.rotation !== 0 || entry.flipH || entry.flipV) && (
                      <div className="flex gap-1">
                        {entry.rotation !== 0 && <NBadge size="sm">{entry.rotation}°</NBadge>}
                        {entry.flipH && <NBadge size="sm" color="accent">Flip H</NBadge>}
                        {entry.flipV && <NBadge size="sm" color="accent">Flip V</NBadge>}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <NTooltip message="Rotate left">
                      <NButton
                        isOutline
                        className="h-8 w-8 min-w-0 p-0"
                        onClick={() =>
                          updateEntry(i, { rotation: (entry.rotation - 90 + 360) % 360, result: undefined })
                        }
                      >
                        <RotateCcw className="h-4 w-4" />
                      </NButton>
                    </NTooltip>
                    <NTooltip message="Rotate right">
                      <NButton
                        isOutline
                        className="h-8 w-8 min-w-0 p-0"
                        onClick={() =>
                          updateEntry(i, { rotation: (entry.rotation + 90) % 360, result: undefined })
                        }
                      >
                        <RotateCw className="h-4 w-4" />
                      </NButton>
                    </NTooltip>
                    <NTooltip message="Flip horizontal">
                      <NButton
                        isOutline
                        className="h-8 w-8 min-w-0 p-0"
                        onClick={() => updateEntry(i, { flipH: !entry.flipH, result: undefined })}
                      >
                        <FlipHorizontal className="h-4 w-4" />
                      </NButton>
                    </NTooltip>
                    <NTooltip message="Flip vertical">
                      <NButton
                        isOutline
                        className="h-8 w-8 min-w-0 p-0"
                        onClick={() => updateEntry(i, { flipV: !entry.flipV, result: undefined })}
                      >
                        <FlipVertical className="h-4 w-4" />
                      </NButton>
                    </NTooltip>
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

export default RotateImage;

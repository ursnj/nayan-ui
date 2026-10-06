"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";

const PREVIEW_SIZES = [16, 32, 48, 180, 192, 512];

const FaviconGenerator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [appName, setAppName] = useState("My App");
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const imageUrlRef = useRef<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    setFile(f);
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => setImage(img);
    img.onerror = () => showToast("Failed to load image");
    img.src = url;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = url;
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  // Client-side thumbnails are for preview only — the actual downloadable
  // PNGs are generated server-side with sharp for correct, uncompressed output.
  useEffect(() => {
    if (!image) {
      setPreviews({});
      return;
    }
    const next: Record<number, string> = {};
    for (const size of PREVIEW_SIZES) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
      next[size] = canvas.toDataURL("image/png");
    }
    setPreviews(next);
  }, [image]);

  const clear = useCallback(() => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setImage(null);
    setFile(null);
    setPreviews({});
  }, []);

  const downloadZip = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", appName);
      const res = await fetch("/api/image-tools/favicon", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Favicon generation failed" }));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicons.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Favicon generation failed");
    } finally {
      setProcessing(false);
    }
  }, [file, appName]);

  return (
    <div>
      {!image ? (
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
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">
            Drop a square source image here or click to upload (512×512 or larger recommended)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </NCard>
      ) : (
        <>
          <NInput
            label="App name (used in site.webmanifest)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="mb-4 max-w-sm"
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={downloadZip} isLoading={processing} loadingText="Generating…">
              <Download className="mr-2 h-4 w-4" />
              Download All (.zip)
            </NButton>
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {PREVIEW_SIZES.map((size) => (
              <NCard key={size} className="flex flex-col items-center gap-2 p-3">
                {previews[size] && (
                  <img
                    src={previews[size]}
                    alt={`${size}x${size} preview`}
                    className="h-12 w-12 rounded border border-default object-cover"
                  />
                )}
                <p className="text-xs text-muted">
                  {size}×{size}
                </p>
              </NCard>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
            <ImagePlus className="h-3.5 w-3.5" />
            The ZIP includes all 6 PNG sizes, a site.webmanifest, and ready-to-paste HTML tags.
          </p>
        </>
      )}
    </div>
  );
};

export default FaviconGenerator;

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, Download, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";
import { useObjectUrl } from "./useObjectUrl";

const clampInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

const CropImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(400);
  const [cropH, setCropH] = useState(300);
  const [cropped, setCropped] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imageUrlRef = useRef<string | null>(null);
  const croppedPreviewUrl = useObjectUrl(cropped);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setSourceFile(file);
    setCropped(null);
    const bitmap = await createImageBitmap(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setCropX(0);
      setCropY(0);
      setCropW(Math.min(400, bitmap.width));
      setCropH(Math.min(300, bitmap.height));
      bitmap.close();
    };
    img.src = url;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = url;
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 600 / image.naturalWidth);
    canvas.width = image.naturalWidth * scale;
    canvas.height = image.naturalHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sx = cropX * scale;
    const sy = cropY * scale;
    const sw = cropW * scale;
    const sh = cropH * scale;
    ctx.drawImage(image, cropX, cropY, cropW, cropH, sx, sy, sw, sh);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, sw, sh);
  }, [image, cropX, cropY, cropW, cropH]);

  const doCrop = useCallback(async () => {
    if (!image || !sourceFile) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", sourceFile);
      form.append("left", String(cropX));
      form.append("top", String(cropY));
      form.append("width", String(cropW));
      form.append("height", String(cropH));
      const res = await fetch("/api/image-tools/crop", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Crop failed" }));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      setCropped(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Crop failed");
    } finally {
      setProcessing(false);
    }
  }, [image, sourceFile, cropX, cropY, cropW, cropH]);

  const download = useCallback(() => {
    if (!cropped || !croppedPreviewUrl) return;
    const a = document.createElement("a");
    a.href = croppedPreviewUrl;
    a.download = `cropped-${fileName}`;
    a.click();
  }, [cropped, croppedPreviewUrl, fileName]);

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
            if (f?.type.startsWith("image/")) handleFile(f);
          }}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
          <p className="text-sm text-muted">Drop an image here or click to upload</p>
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
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <NInput
              type="number"
              label="X"
              value={String(cropX)}
              onChange={(e) => setCropX(clampInt(Number(e.target.value), 0, image.naturalWidth - 1))}
              className="mb-0 w-20"
            />
            <NInput
              type="number"
              label="Y"
              value={String(cropY)}
              onChange={(e) => setCropY(clampInt(Number(e.target.value), 0, image.naturalHeight - 1))}
              className="mb-0 w-20"
            />
            <NInput
              type="number"
              label="W"
              value={String(cropW)}
              onChange={(e) => setCropW(clampInt(Number(e.target.value), 1, image.naturalWidth - cropX))}
              className="mb-0 w-20"
            />
            <NInput
              type="number"
              label="H"
              value={String(cropH)}
              onChange={(e) => setCropH(clampInt(Number(e.target.value), 1, image.naturalHeight - cropY))}
              className="mb-0 w-20"
            />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <NButton onClick={doCrop} isLoading={processing} loadingText="Cropping…">
              <Crop className="mr-2 h-4 w-4" />
              Crop
            </NButton>
            {cropped && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton
              isOutline
              onClick={() => {
                if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
                imageUrlRef.current = null;
                setImage(null);
                setSourceFile(null);
                setCropped(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
          <NCard className="overflow-auto p-2">
            <canvas ref={canvasRef} className="mx-auto" />
          </NCard>
          {cropped && croppedPreviewUrl && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
              <NCard className="inline-block p-2">
                <img
                  src={croppedPreviewUrl}
                  alt="Cropped preview"
                  className="max-h-64 object-contain"
                />
              </NCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CropImage;

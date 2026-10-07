"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FlipHorizontal, FlipVertical, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

const FlipImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imageUrlRef = useRef<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    setFileName(file.name);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setFlipH(false);
      setFlipV(false);
    };
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

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.setTransform(
      flipH ? -1 : 1,
      0,
      0,
      flipV ? -1 : 1,
      flipH ? canvas.width : 0,
      flipV ? canvas.height : 0,
    );
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }, [image, flipH, flipV]);

  const clear = useCallback(() => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setImage(null);
    setFileName("");
  }, []);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast("Failed to export image");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flipped-${fileName || "image.png"}`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [fileName]);

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
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton isOutline={!flipH} onClick={() => setFlipH((v) => !v)}>
              <FlipHorizontal className="mr-2 h-4 w-4" />
              Flip Horizontal
            </NButton>
            <NButton isOutline={!flipV} onClick={() => setFlipV((v) => !v)}>
              <FlipVertical className="mr-2 h-4 w-4" />
              Flip Vertical
            </NButton>
            <NButton isOutline onClick={download}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </NButton>
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          <NCard className="overflow-auto p-2">
            <canvas ref={canvasRef} className="mx-auto max-h-[480px] max-w-full" />
          </NCard>
        </>
      )}
    </div>
  );
};

export default FlipImage;

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Stamp, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSlider, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const POSITION_OPTIONS: ReactSelectOption[] = [
  { label: "Center", value: "center" },
  { label: "Bottom right", value: "bottom-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Tile", value: "tile" },
];

const WatermarkImage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("Nayan UI");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [position, setPosition] = useState<ReactSelectOption>(POSITION_OPTIONS[0]);
  const [color, setColor] = useState("#ffffff");
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const imageUrlRef = useRef<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setSourceFile(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => setImage(img);
    img.src = url;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = url;
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  const drawWatermark = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";

    const pos = position.value;
    if (pos === "tile") {
      const metrics = ctx.measureText(text);
      const tw = metrics.width + 60;
      const th = fontSize + 40;
      for (let y = 0; y < canvas.height; y += th) {
        for (let x = 0; x < canvas.width; x += tw) {
          ctx.fillText(text, x, y + fontSize / 2);
        }
      }
    } else {
      const metrics = ctx.measureText(text);
      let x: number;
      let y: number;
      if (pos === "center") {
        x = (canvas.width - metrics.width) / 2;
        y = canvas.height / 2;
      } else if (pos === "bottom-right") {
        x = canvas.width - metrics.width - 30;
        y = canvas.height - 30;
      } else {
        x = 30;
        y = canvas.height - 30;
      }
      ctx.fillText(text, x, y);
    }
    ctx.globalAlpha = 1;
  }, [image, text, fontSize, opacity, position, color]);

  useEffect(() => {
    drawWatermark();
  }, [drawWatermark]);

  const download = useCallback(async () => {
    if (!sourceFile) return;
    setDownloading(true);
    try {
      const form = new FormData();
      form.append("file", sourceFile);
      form.append("text", text);
      form.append("fontSize", String(fontSize));
      form.append("opacity", String(opacity));
      form.append("position", position.value);
      form.append("color", color);
      const res = await fetch("/api/image-tools/watermark", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Watermark failed" }));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked-${fileName}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Watermark failed");
    } finally {
      setDownloading(false);
    }
  }, [sourceFile, fileName, text, fontSize, opacity, position, color]);

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
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NInput
              label="Text"
              className="col-span-2 mb-0"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Watermark text"
            />
            <NInput
              type="number"
              label="Font size"
              className="mb-0"
              value={String(fontSize)}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border border-default bg-surface"
              />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NSlider
              label="Opacity"
              className="mb-0"
              min={5}
              max={100}
              value={opacity}
              onChange={setOpacity}
              output={(v) => `${v}%`}
            />
            <NSelect
              label="Position"
              className="mb-0"
              value={position}
              options={POSITION_OPTIONS}
              onChange={(v) => {
                if (v) setPosition(v);
              }}
              isSearchable={false}
            />
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <NButton onClick={download} isLoading={downloading} loadingText="Preparing…">
              <Download className="mr-2 h-4 w-4" />
              Download
            </NButton>
            <NButton
              isOutline
              onClick={() => {
                if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
                imageUrlRef.current = null;
                setImage(null);
                setSourceFile(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
          <NCard className="overflow-auto p-2">
            <canvas ref={canvasRef} className="mx-auto max-w-full" />
          </NCard>
        </>
      )}
    </div>
  );
};

export default WatermarkImage;

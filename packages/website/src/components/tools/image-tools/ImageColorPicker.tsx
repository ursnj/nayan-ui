"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardCopy, Pipette, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

interface PickedColor {
  r: number;
  g: number;
  b: number;
}

const toHex = ({ r, g, b }: PickedColor) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const toRgbString = ({ r, g, b }: PickedColor) => `rgb(${r}, ${g}, ${b})`;

const toHslString = ({ r, g, b }: PickedColor) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

// Quantizes the full set of sampled pixels into buckets (rounding each
// channel to the nearest step) and returns the most frequent buckets as a
// real, computed palette — not a hardcoded list.
function extractPalette(data: Uint8ClampedArray, count: number): PickedColor[] {
  const step = 24;
  const buckets = new Map<string, { sum: PickedColor; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 16) continue; // ignore near-transparent pixels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${Math.round(r / step)},${Math.round(g / step)},${Math.round(b / step)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sum.r += r;
      bucket.sum.g += g;
      bucket.sum.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { sum: { r, g, b }, n: 1 });
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(({ sum, n }) => ({
      r: Math.round(sum.r / n),
      g: Math.round(sum.g / n),
      b: Math.round(sum.b / n),
    }));
}

const ImageColorPicker = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<PickedColor | null>(null);
  const [palette, setPalette] = useState<PickedColor[]>([]);
  const imageUrlRef = useRef<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setPicked(null);
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
    const scale = Math.min(1, 700 / image.naturalWidth);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setPalette(extractPalette(data, 6));
  }, [image]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    setPicked({ r, g, b });
  }, []);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  const clear = useCallback(() => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setImage(null);
    setPicked(null);
    setPalette([]);
  }, []);

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
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Pipette className="h-4 w-4" />
              Click anywhere on the image to sample a color
            </p>
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          <NCard className="mb-5 overflow-auto p-2">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="mx-auto max-w-full cursor-crosshair"
            />
          </NCard>

          {picked && (
            <NCard className="mb-5 flex flex-wrap items-center gap-4 p-4">
              <div
                className="h-16 w-16 shrink-0 rounded-lg border border-default"
                style={{ backgroundColor: toRgbString(picked) }}
              />
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "HEX", value: toHex(picked) },
                  { label: "RGB", value: toRgbString(picked) },
                  { label: "HSL", value: toHslString(picked) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-10 text-xs font-medium text-muted">{label}</span>
                    <code className="font-mono text-sm text-foreground">{value}</code>
                    <NButton isOutline className="h-6 px-2 text-xs" onClick={() => copy(value)}>
                      <ClipboardCopy className="h-3 w-3" />
                    </NButton>
                  </div>
                ))}
              </div>
            </NCard>
          )}

          {palette.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Dominant Palette</p>
              <div className="flex flex-wrap gap-3">
                {palette.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => copy(toHex(color))}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="h-14 w-14 rounded-lg border border-default transition-transform group-hover:scale-105"
                      style={{ backgroundColor: toRgbString(color) }}
                    />
                    <code className="text-xs text-muted">{toHex(color)}</code>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageColorPicker;

"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Stamp, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSlider, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const POSITION_OPTIONS: ReactSelectOption[] = [
  { label: "Center (diagonal)", value: "center" },
  { label: "Top left", value: "top-left" },
  { label: "Top right", value: "top-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Bottom right", value: "bottom-right" },
  { label: "Tile", value: "tile" },
];

const WatermarkPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(30);
  const [color, setColor] = useState("#888888");
  const [position, setPosition] = useState<ReactSelectOption>(POSITION_OPTIONS[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
  }, []);

  const watermark = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("text", text);
      form.append("fontSize", String(fontSize));
      form.append("opacity", String(opacity));
      form.append("color", color);
      form.append("position", position.value);
      form.append("rotation", position.value === "center" ? "-45" : "0");
      const res = await fetch("/api/pdf-tools/watermark", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Watermark failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      setResult(blob);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Watermark failed");
    } finally {
      setProcessing(false);
    }
  }, [file, text, fontSize, opacity, color, position]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermarked-${file?.name || "document.pdf"}`;
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
          <p className="text-sm text-muted">Drop a PDF file here or click to upload</p>
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
          </NCard>

          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NInput
              label="Watermark text"
              className="col-span-2 mb-0"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <NInput
              type="number"
              label="Font size"
              className="mb-0"
              min={6}
              max={500}
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
              onChange={(v) => { if (v) setPosition(v); }}
              isSearchable={false}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={watermark} isLoading={processing} loadingText="Adding watermark…">
              <Stamp className="mr-2 h-4 w-4" />
              Add Watermark
            </NButton>
            {result && (
              <NButton isOutline onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton isOutline onClick={() => { setFile(null); setResult(null); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default WatermarkPdf;

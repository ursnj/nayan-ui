"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenTool, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSlider, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const POSITION_OPTIONS: ReactSelectOption[] = [
  { label: "Bottom right", value: "bottom-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Top right", value: "top-right" },
  { label: "Top left", value: "top-left" },
];

const SignPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [position, setPosition] = useState<ReactSelectOption>(POSITION_OPTIONS[0]);
  const [width, setWidth] = useState(160);
  const [hasSignature, setHasSignature] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/pdf-tools/info", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setPageCount(data.pageCount || 1);
        setPageNumber(data.pageCount || 1);
      }
    } catch {
      // Page-count lookup is a convenience only — signing still works with
      // the default page number if this fails.
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
  }, [file]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
    setHasSignature(true);
  };

  const stopDraw = () => {
    drawingRef.current = false;
  };

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setHasSignature(false);
  }, []);

  const sign = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!file || !canvas || !hasDrawnRef.current) {
      showToast("Draw a signature first");
      return;
    }
    setProcessing(true);
    try {
      const signatureDataUrl = canvas.toDataURL("image/png");
      const form = new FormData();
      form.append("file", file);
      form.append("signature", signatureDataUrl);
      form.append("page", String(pageNumber));
      form.append("position", position.value);
      form.append("width", String(width));
      const res = await fetch("/api/pdf-tools/sign", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Signing failed" }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, "")}-signed.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("PDF signed — download started");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setProcessing(false);
    }
  }, [file, pageNumber, position, width]);

  const clearAll = useCallback(() => {
    setFile(null);
    clearSignature();
  }, [clearSignature]);

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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </NCard>
      ) : (
        <>
          <NCard className="mb-4 p-3">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{pageCount} page{pageCount === 1 ? "" : "s"}</p>
          </NCard>

          <p className="mb-2 text-sm font-medium text-foreground">Draw your signature</p>
          <NCard className="mb-2 p-0 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              className="w-full touch-none bg-white"
              style={{ height: 160 }}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={stopDraw}
              onPointerLeave={stopDraw}
            />
          </NCard>
          <div className="mb-5 flex items-center gap-3">
            <NButton isOutline onClick={clearSignature} className="h-8 px-3 text-xs">
              <Eraser className="mr-1.5 h-3.5 w-3.5" />
              Clear signature
            </NButton>
            {!hasSignature && <span className="text-xs text-muted">Draw with your mouse or finger above</span>}
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <NInput
              type="number"
              label="Page number"
              value={String(pageNumber)}
              onChange={(e) => setPageNumber(Math.min(Math.max(1, Number(e.target.value) || 1), pageCount))}
              min={1}
              max={pageCount}
            />
            <NSelect
              label="Position"
              value={position}
              options={POSITION_OPTIONS}
              onChange={(v) => { if (v) setPosition(v); }}
              isSearchable={false}
            />
          </div>

          <NSlider
            label="Signature width"
            className="mb-5"
            min={60}
            max={320}
            value={width}
            onChange={setWidth}
            output={(v) => `${v}pt`}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <NButton onClick={sign} isLoading={processing} loadingText="Signing…" disabled={!hasSignature}>
              <PenTool className="mr-2 h-4 w-4" />
              Sign &amp; Download
            </NButton>
            <NButton isOutline onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SignPdf;

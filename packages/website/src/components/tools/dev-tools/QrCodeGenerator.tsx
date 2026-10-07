"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { NButton, NInput, NCard, NSelect, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const SIZE_OPTIONS: ReactSelectOption[] = [
  { label: "128 × 128", value: "128" },
  { label: "256 × 256", value: "256" },
  { label: "512 × 512", value: "512" },
  { label: "1024 × 1024", value: "1024" },
];

const QrCodeGenerator = () => {
  const [text, setText] = useState("");
  const [size, setSize] = useState<ReactSelectOption>(SIZE_OPTIONS[1]);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text || !canvasRef.current) {
      setError(null);
      return;
    }
    const s = Number(size.value);
    QRCode.toCanvas(canvasRef.current, text, { width: s, margin: 2 }, (err) => {
      if (err) {
        setError(
          err.message?.includes("too big")
            ? "Text is too long to fit in a QR code. Try shortening it."
            : "Failed to generate QR code.",
        );
      } else {
        setError(null);
      }
    });
  }, [text, size]);

  const download = useCallback(() => {
    if (!canvasRef.current || error) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
    showToast("QR code downloaded");
  }, [error]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {text && !error && (
          <NButton isOutline onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </NButton>
        )}
        <NButton isOutline onClick={() => setText("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="mb-4 flex gap-3">
        <NInput
          label="Text or URL"
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL to encode..."
        />
        <NSelect
          label="Size"
          className="max-w-40"
          value={size}
          options={SIZE_OPTIONS}
          onChange={(v) => { if (v) setSize(v); }}
          isSearchable={false}
        />
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {text && (
        <NCard className="flex items-center justify-center p-6" hidden={!!error}>
          <canvas ref={canvasRef} className="rounded" style={{ maxWidth: "100%", height: "auto" }} />
        </NCard>
      )}
    </div>
  );
};

export default QrCodeGenerator;

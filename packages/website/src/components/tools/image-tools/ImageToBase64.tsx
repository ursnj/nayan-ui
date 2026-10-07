"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDownUp, ClipboardCopy, Download, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NTextarea, showToast } from "@nayan-ui/react";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ImageToBase64 = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [dragging, setDragging] = useState(false);

  // Encode mode state
  const [fileName, setFileName] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [rawBase64, setRawBase64] = useState("");
  const [originalSize, setOriginalSize] = useState(0);

  // Decode mode state
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedPreview, setDecodedPreview] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const encodeFile = useCallback((file: File) => {
    setFileName(file.name);
    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setDataUrl(result);
      const commaIndex = result.indexOf(",");
      setRawBase64(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => showToast("Failed to read file");
    reader.readAsDataURL(file);
  }, []);

  const handleFile = useCallback(
    (f: File | null | undefined) => {
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        showToast("Please select an image file");
        return;
      }
      encodeFile(f);
    },
    [encodeFile],
  );

  const clearEncode = useCallback(() => {
    setFileName("");
    setDataUrl("");
    setRawBase64("");
    setOriginalSize(0);
  }, []);

  const copy = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  const decode = useCallback(() => {
    setDecodeError("");
    setDecodedPreview("");
    const trimmed = decodeInput.trim();
    if (!trimmed) return;
    const src = trimmed.startsWith("data:") ? trimmed : `data:image/png;base64,${trimmed}`;
    const img = new Image();
    img.onload = () => setDecodedPreview(src);
    img.onerror = () => setDecodeError("This doesn't look like a valid base64-encoded image");
    img.src = src;
  }, [decodeInput]);

  const downloadDecoded = useCallback(() => {
    if (!decodedPreview) return;
    const match = decodedPreview.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mime = match?.[1] || "image/png";
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const a = document.createElement("a");
    a.href = decodedPreview;
    a.download = `decoded-image.${ext}`;
    a.click();
  }, [decodedPreview]);

  const swap = useCallback(() => {
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setDecodeError("");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={swap}>
          <ArrowDownUp className="mr-2 h-4 w-4" />
          {mode === "encode" ? "Switch to Decode" : "Switch to Encode"}
        </NButton>
      </div>

      {mode === "encode" ? (
        <>
          {!dataUrl ? (
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
                handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              <Upload className={`h-8 w-8 ${dragging ? "text-accent" : "text-muted"}`} />
              <p className="text-sm text-muted">Drop an image here or click to upload</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </NCard>
          ) : (
            <>
              <NCard className="mb-4 flex items-center gap-4 p-3">
                <img src={dataUrl} alt={fileName} className="h-16 w-16 rounded object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted">
                    {formatBytes(originalSize)} → {formatBytes(rawBase64.length)} base64
                  </p>
                </div>
              </NCard>

              <div className="mb-5 flex flex-wrap items-center gap-3">
                <NButton isOutline onClick={clearEncode}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </NButton>
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Data URL</label>
                <NButton isOutline className="h-7 px-2 text-xs" onClick={() => copy(dataUrl)}>
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Copy
                </NButton>
              </div>
              <NTextarea
                value={dataUrl}
                isReadOnly
                textareaClassName="h-[100px] resize-none font-mono text-xs"
              />

              <div className="mb-1.5 mt-4 flex items-center justify-between">
                <label className="text-sm font-medium">Raw Base64 (no prefix)</label>
                <NButton isOutline className="h-7 px-2 text-xs" onClick={() => copy(rawBase64)}>
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Copy
                </NButton>
              </div>
              <NTextarea
                value={rawBase64}
                isReadOnly
                textareaClassName="h-[100px] resize-none font-mono text-xs"
              />
            </>
          )}
        </>
      ) : (
        <>
          <NTextarea
            label="Base64 string or data URL"
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            placeholder="Paste a base64 string or data:image/...;base64,... URL"
            textareaClassName="h-[140px] resize-none font-mono text-xs"
          />
          <div className="my-4 flex flex-wrap items-center gap-3">
            <NButton onClick={decode}>Decode</NButton>
            {decodedPreview && (
              <NButton isOutline onClick={downloadDecoded}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </NButton>
            )}
            <NButton
              isOutline
              onClick={() => {
                setDecodeInput("");
                setDecodedPreview("");
                setDecodeError("");
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          {decodeError && <p className="mb-4 text-sm text-danger">{decodeError}</p>}

          {decodedPreview && (
            <NCard className="inline-block p-2">
              <img src={decodedPreview} alt="Decoded preview" className="max-h-80 object-contain" />
            </NCard>
          )}
        </>
      )}
    </div>
  );
};

export default ImageToBase64;

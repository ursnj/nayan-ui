"use client";

import { useCallback, useState } from "react";
import { Info, Trash2, Upload } from "lucide-react";
import { NButton, NCard, showToast } from "@nayan-ui/react";

interface ExifEntry {
  label: string;
  value: string;
}

const TAG_NAMES: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x0132: "DateTime",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISOSpeedRatings",
  0x9003: "DateTimeOriginal",
  0x920a: "FocalLength",
};

const ORIENTATION_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Flip horizontal",
  3: "Rotate 180°",
  4: "Flip vertical",
  5: "Rotate 90° CW + flip",
  6: "Rotate 90° CW",
  7: "Rotate 270° CW + flip",
  8: "Rotate 270° CW",
};

type FieldType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
const FIELD_BYTE_SIZE: Record<FieldType, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

function readIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  littleEndian: boolean,
): { entries: Map<number, ExifEntry>; nextIfdOffset: number; rawTags: Map<number, { type: number; value: number }> } {
  const entries = new Map<number, ExifEntry>();
  const rawTags = new Map<number, { type: number; value: number }>();
  const entryCount = view.getUint16(ifdOffset, littleEndian);

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian) as FieldType;
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const byteSize = (FIELD_BYTE_SIZE[type] || 1) * count;
    const valueOffset = byteSize <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, littleEndian);

    let display = "";
    let numericValue: number | undefined;

    if (type === 2) {
      // ASCII string
      const bytes: number[] = [];
      for (let b = 0; b < count - 1 && b < 256; b++) {
        const byte = view.getUint8(valueOffset + b);
        if (byte === 0) break;
        bytes.push(byte);
      }
      display = String.fromCharCode(...bytes);
    } else if (type === 5 || type === 10) {
      // Rational / signed rational (numerator/denominator pair)
      const num = type === 5 ? view.getUint32(valueOffset, littleEndian) : view.getInt32(valueOffset, littleEndian);
      const den =
        type === 5 ? view.getUint32(valueOffset + 4, littleEndian) : view.getInt32(valueOffset + 4, littleEndian);
      numericValue = den !== 0 ? num / den : 0;
      if (tag === 0x829a && numericValue < 1 && num > 0) {
        // Conventional photography notation, e.g. "1/250" rather than "0.004".
        display = `1/${Math.round(den / num)}`;
      } else {
        display = den !== 0 ? String(parseFloat(numericValue.toFixed(4))) : "0";
      }
    } else if (type === 3) {
      numericValue = view.getUint16(valueOffset, littleEndian);
      display = String(numericValue);
    } else if (type === 4) {
      numericValue = view.getUint32(valueOffset, littleEndian);
      display = String(numericValue);
    } else {
      numericValue = view.getUint8(valueOffset);
      display = String(numericValue);
    }

    rawTags.set(tag, { type, value: numericValue ?? valueOffset });

    const name = TAG_NAMES[tag];
    if (name) {
      let shown = display;
      if (tag === 0x0112 && numericValue !== undefined) {
        shown = ORIENTATION_LABELS[numericValue] || display;
      } else if (tag === 0x829a) {
        shown = `${display}s`;
      } else if (tag === 0x829d) {
        shown = `f/${display}`;
      } else if (tag === 0x920a) {
        shown = `${display}mm`;
      }
      entries.set(tag, { label: name, value: shown });
    }

    // Keep sub-IFD pointers (Exif IFD 0x8769, GPS IFD 0x8825) for the caller.
    if (tag === 0x8769 || tag === 0x8825) {
      rawTags.set(tag, { type, value: tiffStart + (numericValue ?? 0) });
    }
  }

  const nextIfdOffset = view.getUint32(ifdOffset + 2 + entryCount * 12, littleEndian);
  return { entries, nextIfdOffset, rawTags };
}

function parseGpsIfd(view: DataView, tiffStart: number, gpsOffset: number, littleEndian: boolean): string | null {
  const entryCount = view.getUint16(gpsOffset, littleEndian);
  const coords: Record<string, { deg: number; min: number; sec: number } | string> = {};

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = gpsOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const byteSize = (FIELD_BYTE_SIZE[type as FieldType] || 1) * count;
    const valueOffset = byteSize <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, littleEndian);

    if (type === 5 && count === 3 && (tag === 2 || tag === 4)) {
      const parts = [0, 1, 2].map((p) => {
        const num = view.getUint32(valueOffset + p * 8, littleEndian);
        const den = view.getUint32(valueOffset + p * 8 + 4, littleEndian);
        return den !== 0 ? num / den : 0;
      });
      coords[tag === 2 ? "lat" : "lng"] = { deg: parts[0], min: parts[1], sec: parts[2] };
    } else if (type === 2 && (tag === 1 || tag === 3)) {
      coords[tag === 1 ? "latRef" : "lngRef"] = String.fromCharCode(view.getUint8(valueOffset));
    }
  }

  const lat = coords.lat;
  const lng = coords.lng;
  if (typeof lat === "object" && typeof lng === "object") {
    const latDec = (lat.deg + lat.min / 60 + lat.sec / 3600) * (coords.latRef === "S" ? -1 : 1);
    const lngDec = (lng.deg + lng.min / 60 + lng.sec / 3600) * (coords.lngRef === "W" ? -1 : 1);
    return `${latDec.toFixed(6)}, ${lngDec.toFixed(6)}`;
  }
  return null;
}

function parseExif(buffer: ArrayBuffer): ExifEntry[] | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG

  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break;
    const segmentLength = view.getUint16(offset + 2);

    if (marker === 0xffe1) {
      const sigStart = offset + 4;
      const sig = String.fromCharCode(
        view.getUint8(sigStart),
        view.getUint8(sigStart + 1),
        view.getUint8(sigStart + 2),
        view.getUint8(sigStart + 3),
      );
      if (sig === "Exif") {
        const tiffStart = sigStart + 6;
        const byteOrder = String.fromCharCode(view.getUint8(tiffStart), view.getUint8(tiffStart + 1));
        const littleEndian = byteOrder === "II";
        const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);

        const { entries, rawTags } = readIfd(view, tiffStart, tiffStart + firstIfdOffset, littleEndian);

        const exifIfdPtr = rawTags.get(0x8769);
        if (exifIfdPtr) {
          const sub = readIfd(view, tiffStart, exifIfdPtr.value, littleEndian);
          sub.entries.forEach((v, k) => entries.set(k, v));
        }

        const gpsIfdPtr = rawTags.get(0x8825);
        if (gpsIfdPtr) {
          const coord = parseGpsIfd(view, tiffStart, gpsIfdPtr.value, littleEndian);
          if (coord) entries.set(-1, { label: "GPS Coordinates", value: coord });
        }

        return [...entries.values()];
      }
    }

    if (marker === 0xffda) break; // start of scan — no more metadata segments follow
    offset += 2 + segmentLength;
  }
  return null;
}

const ImageExifViewer = () => {
  const [fileName, setFileName] = useState("");
  const [entries, setEntries] = useState<ExifEntry[] | null>(null);
  const [notJpeg, setNotJpeg] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    setFileName(file.name);
    setNotJpeg(false);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExif(buffer);
      if (result === null) {
        if (file.type !== "image/jpeg" && file.type !== "image/jpg") setNotJpeg(true);
        setEntries([]);
      } else {
        setEntries(result);
      }
    } catch {
      showToast("Failed to parse this file");
      setEntries([]);
    }
  }, []);

  const clear = useCallback(() => {
    setFileName("");
    setEntries(null);
    setNotJpeg(false);
  }, []);

  return (
    <div>
      {entries === null ? (
        <NCard
          className={`mb-6 flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 transition-colors ${dragging ? "border-accent" : ""}`}
          onClick={() => document.getElementById("exif-file-input")?.click()}
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
          <p className="text-sm text-muted">Drop a JPEG photo here or click to upload</p>
          <input
            id="exif-file-input"
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
            <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
            <NButton isOutline onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </NButton>
          </div>

          {entries.length === 0 ? (
            <NCard className="flex items-center gap-2 p-4 text-sm text-muted">
              <Info className="h-4 w-4 shrink-0" />
              {notJpeg
                ? "This file format doesn't carry EXIF metadata (only JPEG photos typically do)."
                : "No EXIF metadata found in this file — it may have been stripped by an app or messaging service."}
            </NCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {entries.map((entry, i) => (
                <NCard key={i} className="flex items-center justify-between gap-3 p-3">
                  <span className="text-sm text-muted">{entry.label}</span>
                  <span className="truncate text-sm font-medium text-foreground">{entry.value}</span>
                </NCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageExifViewer;

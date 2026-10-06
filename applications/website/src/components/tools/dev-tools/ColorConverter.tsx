"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NInput, NCard, showToast } from "@nayan-ui/react";

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace("#", "");
  const shorthand = cleaned.match(/^([a-f0-9])([a-f0-9])([a-f0-9])$/i);
  if (shorthand) {
    return [
      parseInt(shorthand[1] + shorthand[1], 16),
      parseInt(shorthand[2] + shorthand[2], 16),
      parseInt(shorthand[3] + shorthand[3], 16),
    ];
  }
  const m = cleaned.match(/^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const ColorConverter = () => {
  const [hex, setHex] = useState("#3b82f6");

  const colors = useMemo(() => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const [r, g, b] = rgb;
    const [h, s, l] = rgbToHsl(r, g, b);
    return {
      hex: hex.startsWith("#") ? hex : `#${hex}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      tailwind: `bg-[${hex.startsWith("#") ? hex : `#${hex}`}]`,
    };
  }, [hex]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => setHex("#3b82f6")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Reset
        </NButton>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <NInput
          label="Hex Color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#3b82f6"
          className="max-w-52"
        />
        <input
          type="color"
          aria-label="Pick color"
          value={colors?.hex || "#000000"}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-default"
        />
      </div>

      {colors && (
        <>
          <div
            className="mb-4 h-24 w-full rounded-lg border border-default"
            style={{ backgroundColor: colors.hex }}
          />
          <div className="space-y-2">
            {Object.entries(colors).map(([label, value]) => (
              <NCard key={label} className="flex items-center justify-between p-3">
                <div>
                  <span className="text-xs font-medium uppercase text-muted">{label}</span>
                  <code className="ml-3 font-mono text-sm text-foreground">{value}</code>
                </div>
                <NButton isOutline onClick={() => copy(value)} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="h-3 w-3" />
                </NButton>
              </NCard>
            ))}
          </div>
        </>
      )}

      {!colors && hex && <p className="text-sm text-danger">Invalid hex color</p>}
    </div>
  );
};

export default ColorConverter;

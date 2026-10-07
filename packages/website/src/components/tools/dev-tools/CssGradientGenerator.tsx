"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCopy, Plus, Trash2 } from "lucide-react";
import { NButton, NCard, NSlider, showToast } from "@nayan-ui/react";

interface Stop {
  id: string;
  color: string;
  pos: number;
}

let nextId = 0;
const makeId = () => `stop-${nextId++}`;

const DEFAULT_STOPS: Stop[] = [
  { id: makeId(), color: "#3b82f6", pos: 0 },
  { id: makeId(), color: "#8b5cf6", pos: 100 },
];

const CssGradientGenerator = () => {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<Stop[]>(DEFAULT_STOPS);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.pos - b.pos), [stops]);

  const gradient = useMemo(() => {
    const stopList = sortedStops.map((s) => `${s.color} ${s.pos}%`).join(", ");
    return type === "linear" ? `linear-gradient(${angle}deg, ${stopList})` : `radial-gradient(circle, ${stopList})`;
  }, [type, angle, sortedStops]);

  const addStop = useCallback(() => {
    setStops((prev) => {
      if (prev.length >= 6) return prev;
      const positions = prev.map((s) => s.pos).sort((a, b) => a - b);
      const mid = positions.length >= 2 ? Math.round((positions[0] + positions[positions.length - 1]) / 2) : 50;
      return [...prev, { id: makeId(), color: "#ffffff", pos: mid }];
    });
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => (prev.length <= 2 ? prev : prev.filter((s) => s.id !== id)));
  }, []);

  const updateStop = useCallback((id: string, patch: Partial<Stop>) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const copy = useCallback(() => {
    const css = `background: ${gradient};`;
    navigator.clipboard.writeText(css);
    showToast("Copied to clipboard");
  }, [gradient]);

  return (
    <div>
      <NCard className="mb-4 p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <NButton isOutline={type !== "linear"} onClick={() => setType("linear")}>
            Linear
          </NButton>
          <NButton isOutline={type !== "radial"} onClick={() => setType("radial")}>
            Radial
          </NButton>
        </div>

        {type === "linear" && (
          <NSlider label="Angle" value={angle} min={0} max={360} step={1} showOutput onChange={setAngle} />
        )}

        <div className="mt-4 space-y-3">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-3">
              <input
                type="color"
                aria-label={`Stop color at ${stop.pos}%`}
                value={stop.color}
                onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                className="h-9 w-9 shrink-0 cursor-pointer rounded border border-default"
              />
              <div className="flex-1">
                <NSlider
                  value={stop.pos}
                  min={0}
                  max={100}
                  step={1}
                  showOutput
                  output={(v) => `${v}%`}
                  onChange={(v) => updateStop(stop.id, { pos: v })}
                />
              </div>
              <NButton
                isOutline
                onClick={() => removeStop(stop.id)}
                disabled={stops.length <= 2}
                className="h-9 px-2"
                aria-label="Remove color stop"
              >
                <Trash2 className="h-4 w-4" />
              </NButton>
            </div>
          ))}
        </div>

        <NButton isOutline onClick={addStop} disabled={stops.length >= 6} className="mt-3">
          <Plus className="mr-2 h-4 w-4" />
          Add Stop
        </NButton>
      </NCard>

      <div className="mb-4 h-32 w-full rounded-lg border border-default" style={{ backgroundImage: gradient }} />

      <NCard className="p-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium">CSS</label>
          <NButton isOutline onClick={copy} className="h-7 px-2 text-xs">
            <ClipboardCopy className="mr-1 h-3 w-3" />
            Copy
          </NButton>
        </div>
        <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
          background: {gradient};
        </code>
      </NCard>
    </div>
  );
};

export default CssGradientGenerator;

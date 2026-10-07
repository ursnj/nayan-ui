"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2, Clock } from "lucide-react";
import { NButton, NInput, NCard, showToast } from "@nayan-ui/react";

const TimestampConverter = () => {
  const [timestamp, setTimestamp] = useState("");
  const [dateStr, setDateStr] = useState("");

  const fromTs = useMemo(() => {
    if (!timestamp) return null;
    const ts = Number(timestamp);
    if (isNaN(ts)) return null;
    const ms = ts > 1e12 ? ts : ts * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return {
      utc: d.toUTCString(),
      iso: d.toISOString(),
      local: d.toLocaleString(),
      relative: getRelative(d),
    };
  }, [timestamp]);

  const fromDate = useMemo(() => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return {
      seconds: Math.floor(d.getTime() / 1000),
      milliseconds: d.getTime(),
    };
  }, [dateStr]);

  const setNow = useCallback(() => {
    const now = Date.now();
    setTimestamp(String(Math.floor(now / 1000)));
  }, []);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={setNow}>
          <Clock className="mr-2 h-4 w-4" />
          Use Current Time
        </NButton>
        <NButton isOutline onClick={() => { setTimestamp(""); setDateStr(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <NInput
            label="Unix Timestamp"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="e.g. 1700000000"
          />
          {timestamp && !fromTs && <p className="mt-2 text-sm text-danger">Invalid timestamp</p>}
          {fromTs && (
            <div className="mt-3 space-y-2">
              {Object.entries(fromTs).map(([label, value]) => (
                <NCard key={label} className="flex items-center justify-between p-3">
                  <div>
                    <span className="text-xs font-medium capitalize text-muted">{label}</span>
                    <code className="ml-2 font-mono text-sm text-foreground">{value}</code>
                  </div>
                  <NButton isOutline onClick={() => copy(String(value))} className="h-7 px-2 text-xs">
                    <ClipboardCopy className="h-3 w-3" />
                  </NButton>
                </NCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <NInput
            label="Date String"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            placeholder="e.g. 2024-01-15T12:00:00Z"
          />
          {dateStr && !fromDate && <p className="mt-2 text-sm text-danger">Invalid date</p>}
          {fromDate && (
            <div className="mt-3 space-y-2">
              <NCard className="flex items-center justify-between p-3">
                <div>
                  <span className="text-xs font-medium text-muted">Seconds</span>
                  <code className="ml-2 font-mono text-sm text-foreground">{fromDate.seconds}</code>
                </div>
                <NButton isOutline onClick={() => copy(String(fromDate.seconds))} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="h-3 w-3" />
                </NButton>
              </NCard>
              <NCard className="flex items-center justify-between p-3">
                <div>
                  <span className="text-xs font-medium text-muted">Milliseconds</span>
                  <code className="ml-2 font-mono text-sm text-foreground">{fromDate.milliseconds}</code>
                </div>
                <NButton isOutline onClick={() => copy(String(fromDate.milliseconds))} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="h-3 w-3" />
                </NButton>
              </NCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const suffix = diff > 0 ? "ago" : "from now";
  if (abs < 60000) return `${Math.floor(abs / 1000)}s ${suffix}`;
  if (abs < 3600000) return `${Math.floor(abs / 60000)}m ${suffix}`;
  if (abs < 86400000) return `${Math.floor(abs / 3600000)}h ${suffix}`;
  return `${Math.floor(abs / 86400000)}d ${suffix}`;
}

export default TimestampConverter;

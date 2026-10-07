"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Trash2, RefreshCw } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";

const UuidGenerator = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);

  const generate = useCallback(() => {
    const n = Math.min(Math.max(1, Math.floor(count) || 1), 100);
    const list: string[] = [];
    for (let i = 0; i < n; i++) list.push(crypto.randomUUID());
    setUuids(list);
  }, [count]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  const copyAll = useCallback(() => {
    navigator.clipboard.writeText(uuids.join("\n"));
    showToast(`Copied ${uuids.length} UUIDs to clipboard`);
  }, [uuids]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={generate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate
        </NButton>
        {uuids.length > 1 && (
          <NButton isOutline onClick={copyAll}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy All
          </NButton>
        )}
        <NButton isOutline onClick={() => setUuids([])}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NInput
        label="Count"
        type="number"
        min={1}
        max={100}
        className="mb-4 max-w-32"
        value={String(count)}
        onChange={(e) => setCount(Math.min(100, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
      />

      {uuids.length > 0 && (
        <NCard className="divide-y divide-default">
          {uuids.map((uuid) => (
            <div
              key={uuid}
              className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-default/30"
              onClick={() => copy(uuid)}
            >
              <code className="select-all font-mono text-sm text-foreground">{uuid}</code>
              <ClipboardCopy className="ml-3 h-3.5 w-3.5 shrink-0 text-muted" />
            </div>
          ))}
        </NCard>
      )}
    </div>
  );
};

export default UuidGenerator;

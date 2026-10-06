"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

async function computeHash(text: string, algo: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const HashGenerator = () => {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (!input) return;
    if (!crypto?.subtle) {
      showToast("Hashing requires a secure (HTTPS) context");
      return;
    }
    setGenerating(true);
    try {
      const results: Record<string, string> = {};
      for (const algo of ALGOS) {
        results[algo] = await computeHash(input, algo);
      }
      setHashes(results);
    } catch {
      showToast("Failed to generate hashes");
    } finally {
      setGenerating(false);
    }
  }, [input]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={generate} isLoading={generating} loadingText="Generating…">Generate Hashes</NButton>
        <NButton isOutline onClick={() => { setInput(""); setHashes({}); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label="Input Text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text to hash..."
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {Object.keys(hashes).length > 0 && (
        <div className="mt-4 space-y-3">
          {ALGOS.map((algo) => (
            <NCard key={algo} className="p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">{algo}</label>
                <NButton isOutline onClick={() => copy(hashes[algo])} className="h-7 px-2 text-xs">
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Copy
                </NButton>
              </div>
              <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
                {hashes[algo]}
              </code>
            </NCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashGenerator;

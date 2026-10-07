"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCheck, showToast } from "@nayan-ui/react";

const NAMED_ENCODE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const NAMED_DECODE: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  deg: "°",
  plusmn: "±",
  times: "×",
  divide: "÷",
  laquo: "«",
  raquo: "»",
  middot: "·",
};

function encodeHtml(input: string, encodeNonAscii: boolean): string {
  let out = "";
  for (const ch of input) {
    if (NAMED_ENCODE[ch]) {
      out += NAMED_ENCODE[ch];
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    out += encodeNonAscii && code > 127 ? `&#${code};` : ch;
  }
  return out;
}

function decodeHtml(input: string): string {
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const num = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (Number.isNaN(num)) return match;
      try {
        return String.fromCodePoint(num);
      } catch {
        return match;
      }
    }
    return Object.prototype.hasOwnProperty.call(NAMED_DECODE, body) ? NAMED_DECODE[body] : match;
  });
}

const HtmlEntityEncoderDecoder = () => {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encode" ? encodeHtml(input, encodeNonAscii) : decodeHtml(input);
  }, [input, mode, encodeNonAscii]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const clear = useCallback(() => setInput(""), []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline={mode !== "encode"} onClick={() => setMode("encode")}>
          Encode
        </NButton>
        <NButton isOutline={mode !== "decode"} onClick={() => setMode("decode")}>
          Decode
        </NButton>
        {mode === "encode" && (
          <NCheck
            checked={encodeNonAscii}
            onChange={setEncodeNonAscii}
            label="Also encode non-ASCII characters"
          />
        )}
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label={mode === "encode" ? "Text / HTML" : "HTML Entities"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "encode" ? '<div class="test">Café</div>' : "&lt;div&gt;Caf&#233;&lt;/div&gt;"}
        textareaClassName="h-[160px] resize-none font-mono text-sm"
      />

      <div className="mb-1.5 mt-4 flex items-center justify-between">
        <label className="text-sm font-medium">Output</label>
        <NButton isOutline onClick={copy} className="h-7 px-2 text-xs">
          <ClipboardCopy className="mr-1 h-3 w-3" />
          Copy
        </NButton>
      </div>
      <code className="block min-h-[80px] whitespace-pre-wrap break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
        {output}
      </code>
    </div>
  );
};

export default HtmlEntityEncoderDecoder;

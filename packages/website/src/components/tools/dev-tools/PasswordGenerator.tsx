"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCopy, KeyRound } from "lucide-react";
import { NButton, NCard, NCheck, NSlider, NBadge, showToast } from "@nayan-ui/react";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = new Set(["0", "O", "1", "l", "I"]);

// Rejection sampling against crypto.getRandomValues avoids the small modulo
// bias you'd get from `randomByte % charset.length` for charset lengths that
// don't evenly divide 256.
function randomIndex(max: number): number {
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= range);
  return v % max;
}

function buildCharset(opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean }): string {
  let charset = "";
  if (opts.upper) charset += UPPER;
  if (opts.lower) charset += LOWER;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  if (opts.excludeAmbiguous) {
    charset = Array.from(charset).filter((c) => !AMBIGUOUS.has(c)).join("");
  }
  return charset;
}

function strengthLabel(bits: number): { label: string; color: "danger" | "warning" | "accent" | "success" } {
  if (bits < 40) return { label: "Weak", color: "danger" };
  if (bits < 60) return { label: "Fair", color: "warning" };
  if (bits < 80) return { label: "Strong", color: "accent" };
  return { label: "Very Strong", color: "success" };
}

const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");

  const charset = useMemo(
    () => buildCharset({ upper, lower, numbers, symbols, excludeAmbiguous }),
    [upper, lower, numbers, symbols, excludeAmbiguous],
  );

  const entropy = useMemo(() => {
    if (charset.length === 0) return 0;
    return length * Math.log2(charset.length);
  }, [length, charset]);

  const strength = strengthLabel(entropy);

  // Guard against unchecking every charset toggle, which would leave an
  // empty charset and make generation impossible.
  const toggle = useCallback(
    (key: "upper" | "lower" | "numbers" | "symbols", value: boolean) => {
      const next = { upper, lower, numbers, symbols, [key]: value };
      if (!next.upper && !next.lower && !next.numbers && !next.symbols) return;
      if (key === "upper") setUpper(value);
      if (key === "lower") setLower(value);
      if (key === "numbers") setNumbers(value);
      if (key === "symbols") setSymbols(value);
    },
    [upper, lower, numbers, symbols],
  );

  const generate = useCallback(() => {
    if (charset.length === 0) {
      showToast("Select at least one character set");
      return;
    }
    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
      chars.push(charset[randomIndex(charset.length)]);
    }
    setPassword(chars.join(""));
  }, [charset, length]);

  const copy = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    showToast("Copied to clipboard");
  }, [password]);

  return (
    <div>
      <NCard className="mb-4 p-4">
        <NSlider
          label="Length"
          value={length}
          min={4}
          max={128}
          step={1}
          showOutput
          onChange={setLength}
        />

        <div className="mt-4 flex flex-wrap gap-4">
          <NCheck checked={upper} onChange={(v) => toggle("upper", v)} label="Uppercase (A-Z)" />
          <NCheck checked={lower} onChange={(v) => toggle("lower", v)} label="Lowercase (a-z)" />
          <NCheck checked={numbers} onChange={(v) => toggle("numbers", v)} label="Numbers (0-9)" />
          <NCheck checked={symbols} onChange={(v) => toggle("symbols", v)} label="Symbols (!@#$...)" />
        </div>
        <div className="mt-3">
          <NCheck
            checked={excludeAmbiguous}
            onChange={setExcludeAmbiguous}
            label="Exclude ambiguous characters (0, O, 1, l, I)"
          />
        </div>
      </NCard>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={generate}>
          <KeyRound className="mr-2 h-4 w-4" />
          Generate Password
        </NButton>
      </div>

      {password && (
        <NCard className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-muted">Password</span>
            <NButton isOutline onClick={copy} className="h-7 px-2 text-xs">
              <ClipboardCopy className="mr-1 h-3 w-3" />
              Copy
            </NButton>
          </div>
          <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
            {password}
          </code>
          <div className="mt-3 flex items-center gap-2">
            <NBadge size="sm" color={strength.color}>
              {strength.label}
            </NBadge>
            <span className="text-xs text-muted">~{Math.round(entropy)} bits of entropy</span>
          </div>
        </NCard>
      )}
    </div>
  );
};

export default PasswordGenerator;

"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NInput, showToast } from "@nayan-ui/react";

type Base = 2 | 8 | 10 | 16;

const VALID_CHARS: Record<Base, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
};

const PREFIX: Record<Base, string> = { 2: "0b", 8: "0o", 10: "", 16: "0x" };

// Parsing/formatting through BigInt (rather than Number/parseInt) avoids
// silently losing precision above 2^53 for large inputs.
function parseInBase(raw: string, base: Base): bigint | null {
  let s = raw.trim();
  if (s === "") return null;
  let negative = false;
  if (s[0] === "-") {
    negative = true;
    s = s.slice(1);
  } else if (s[0] === "+") {
    s = s.slice(1);
  }
  if (s === "" || !VALID_CHARS[base].test(s)) return null;
  try {
    const magnitude = BigInt(PREFIX[base] + s);
    return negative ? -magnitude : magnitude;
  } catch {
    return null;
  }
}

function toBase(value: bigint, base: Base): string {
  return value.toString(base);
}

interface FieldState {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
}

const DEFAULT: FieldState = { bin: "10000", oct: "20", dec: "16", hex: "10" };

const FIELDS: { key: keyof FieldState; base: Base; label: string }[] = [
  { key: "bin", base: 2, label: "Binary" },
  { key: "oct", base: 8, label: "Octal" },
  { key: "dec", base: 10, label: "Decimal" },
  { key: "hex", base: 16, label: "Hexadecimal" },
];

const NumberBaseConverter = () => {
  const [fields, setFields] = useState<FieldState>(DEFAULT);
  const [errors, setErrors] = useState<Partial<Record<keyof FieldState, string>>>({});

  const handleChange = useCallback((key: keyof FieldState, base: Base, raw: string) => {
    if (raw.trim() === "" || raw.trim() === "-" || raw.trim() === "+") {
      setFields((f) => ({ ...f, [key]: raw }));
      setErrors((e) => ({ ...e, [key]: undefined }));
      return;
    }
    const parsed = parseInBase(raw, base);
    if (parsed === null) {
      setFields((f) => ({ ...f, [key]: raw }));
      setErrors({ [key]: `Not a valid base-${base} number` });
      return;
    }
    setErrors({});
    setFields({
      bin: toBase(parsed, 2),
      oct: toBase(parsed, 8),
      dec: toBase(parsed, 10),
      hex: toBase(parsed, 16),
      [key]: raw,
    });
  }, []);

  const copy = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  const reset = useCallback(() => {
    setFields(DEFAULT);
    setErrors({});
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={reset}>
          <Trash2 className="mr-2 h-4 w-4" />
          Reset
        </NButton>
      </div>

      <div className="space-y-4">
        {FIELDS.map(({ key, base, label }) => (
          <div key={key}>
            <div className="flex items-end gap-2">
              <NInput
                label={label}
                value={fields[key]}
                onChange={(e) => handleChange(key, base, e.target.value)}
                className="flex-1"
                inputClassName="font-mono"
              />
              <NButton isOutline onClick={() => copy(fields[key])} className="h-10 px-2">
                <ClipboardCopy className="h-4 w-4" />
              </NButton>
            </div>
            {errors[key] && <p className="mt-1 text-sm text-danger">{errors[key]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NumberBaseConverter;

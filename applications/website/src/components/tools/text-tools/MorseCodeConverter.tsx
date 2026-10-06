"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Radio, Trash2 } from "lucide-react";
import { NButton, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const MORSE_TABLE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
};

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([ch, code]) => [code, ch]),
);

const textToMorse = (text: string): string =>
  text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      Array.from(word)
        .map((ch) => MORSE_TABLE[ch] ?? "")
        .filter(Boolean)
        .join(" "),
    )
    .join(" / ");

const morseToText = (morse: string): string =>
  morse
    .trim()
    .split(/\s*\/\s*/)
    .filter(Boolean)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => REVERSE_MORSE[code] ?? "")
        .join(""),
    )
    .join(" ");

const MorseCodeConverter = () => {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const convert = useCallback(() => {
    setOutput(mode === "encode" ? textToMorse(input) : morseToText(input));
  }, [input, mode]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  const clear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline={mode !== "encode"} onClick={() => { setMode("encode"); setOutput(""); }}>
          Text → Morse
        </NButton>
        <NButton isOutline={mode !== "decode"} onClick={() => { setMode("decode"); setOutput(""); }}>
          Morse → Text
        </NButton>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={convert}>
          <Radio className="mr-2 h-4 w-4" />
          Convert
        </NButton>
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label={mode === "encode" ? "Input Text" : "Input Morse Code"}
          value={input}
          onChange={setInput}
          height="500px"
        />
        <MonacoEditor
          label={mode === "encode" ? "Morse Code Output" : "Decoded Text"}
          value={output}
          readOnly
          height="500px"
        />
      </div>
    </div>
  );
};

export default MorseCodeConverter;

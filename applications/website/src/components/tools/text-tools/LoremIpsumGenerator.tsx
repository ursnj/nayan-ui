"use client";

import { useCallback, useState } from "react";
import { ClipboardCopy, Sparkles, Trash2 } from "lucide-react";
import { NButton, NSelect, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");

const generateSentence = (): string => {
  const len = Math.floor(Math.random() * 10) + 5;
  const words = Array.from({ length: len }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
};

const generateParagraph = (): string => {
  const sentences = Math.floor(Math.random() * 4) + 3;
  return Array.from({ length: sentences }, generateSentence).join(" ");
};

const TYPE_OPTIONS = [
  { label: "Paragraphs", value: "paragraphs" },
  { label: "Sentences", value: "sentences" },
  { label: "Words", value: "words" },
];

const COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));

const LoremIpsumGenerator = () => {
  const [output, setOutput] = useState("");
  const [typeOption, setTypeOption] = useState(TYPE_OPTIONS[0]);
  const [countOption, setCountOption] = useState(COUNT_OPTIONS[2]);

  const generate = useCallback(() => {
    const count = Number(countOption.value);
    const type = typeOption.value;
    let result = "";

    if (type === "paragraphs") {
      result = Array.from({ length: count }, generateParagraph).join("\n\n");
    } else if (type === "sentences") {
      result = Array.from({ length: count }, generateSentence).join(" ");
    } else {
      const words = Array.from(
        { length: count },
        () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)],
      );
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      result = words.join(" ") + ".";
    }

    setOutput(result);
  }, [typeOption, countOption]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [output]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NSelect
          label="Type"
          className="mb-0"
          value={typeOption}
          options={TYPE_OPTIONS}
          onChange={(val) => { if (val) setTypeOption(val); }}
        />
        <NSelect
          label="Count"
          className="mb-0"
          value={countOption}
          options={COUNT_OPTIONS}
          onChange={(val) => { if (val) setCountOption(val); }}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={generate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate
        </NButton>
        {output && (
          <NButton isOutline onClick={copy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </NButton>
        )}
        <NButton
          isOutline
          onClick={() => setOutput("")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <MonacoEditor
        label="Generated Text"
        value={output}
        readOnly
        height="500px"
      />
    </div>
  );
};

export default LoremIpsumGenerator;

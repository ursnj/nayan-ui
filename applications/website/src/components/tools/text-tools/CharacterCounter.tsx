"use client";

import { useState, useMemo } from "react";
import { NCard } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const CharacterCounter = () => {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const avgWordLength = words > 0 ? (charactersNoSpaces / words).toFixed(1) : "0";
    const readingTime = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
    const speakingTime = words > 0 ? Math.max(1, Math.ceil(words / 130)) : 0;

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      avgWordLength,
      readingTime,
      speakingTime,
    };
  }, [text]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Characters", value: stats.characters },
          { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
          { label: "Words", value: stats.words },
          { label: "Sentences", value: stats.sentences },
          { label: "Paragraphs", value: stats.paragraphs },
          { label: "Lines", value: stats.lines },
          { label: "Avg Word Length", value: stats.avgWordLength },
          { label: "Reading Time", value: `${stats.readingTime} min` },
          { label: "Speaking Time", value: `${stats.speakingTime} min` },
        ].map((stat) => (
          <NCard key={stat.label} className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </NCard>
        ))}
      </div>

      <MonacoEditor
        label="Enter your text"
        value={text}
        onChange={setText}
        height="500px"
      />
    </div>
  );
};

export default CharacterCounter;

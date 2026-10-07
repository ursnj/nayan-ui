"use client";

import { useState, useMemo } from "react";
import { NCard } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const WordCounter = () => {
  const [text, setText] = useState("");

  const { totalWords, uniqueWords, topWords } = useMemo(() => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    return {
      totalWords: words.length,
      uniqueWords: Object.keys(freq).length,
      topWords: sorted,
    };
  }, [text]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalWords}</p>
          <p className="text-xs text-muted">Total Words</p>
        </NCard>
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{uniqueWords}</p>
          <p className="text-xs text-muted">Unique Words</p>
        </NCard>
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {totalWords > 0 ? ((uniqueWords / totalWords) * 100).toFixed(0) : 0}%
          </p>
          <p className="text-xs text-muted">Vocabulary Density</p>
        </NCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label="Enter your text"
          value={text}
          onChange={setText}
          height="500px"
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium">Word Frequency (Top 30)</label>
          <div className="max-h-[500px] overflow-auto rounded-lg border border-default bg-surface">
            {topWords.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">Enter text to see word frequency</p>
            ) : (
              topWords.map(([word, count], idx) => (
                <div
                  key={word}
                  className="flex items-center justify-between border-b border-default/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-right text-xs text-muted">{idx + 1}.</span>
                    <span className="text-sm font-medium text-foreground">{word}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-accent/20" style={{ width: `${Math.max(20, (count / topWords[0][1]) * 100)}px` }}>
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / topWords[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCounter;

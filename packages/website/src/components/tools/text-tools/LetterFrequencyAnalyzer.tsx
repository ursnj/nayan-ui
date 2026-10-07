"use client";

import { useMemo, useState } from "react";
import { NCard } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LetterFrequencyAnalyzer = () => {
  const [text, setText] = useState("");

  const { totalLetters, rows, mostFrequent, leastFrequent } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of ALPHABET) counts[ch] = 0;

    let total = 0;
    for (const ch of text.toUpperCase()) {
      if (counts[ch] !== undefined) {
        counts[ch]++;
        total++;
      }
    }

    const sorted = ALPHABET.map((ch) => ({ letter: ch, count: counts[ch] })).sort(
      (a, b) => b.count - a.count,
    );

    const present = sorted.filter((r) => r.count > 0);
    const most = present[0] ?? null;
    const least = present[present.length - 1] ?? null;

    return {
      totalLetters: total,
      rows: sorted,
      mostFrequent: most,
      leastFrequent: least,
    };
  }, [text]);

  const maxCount = rows[0]?.count || 1;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalLetters}</p>
          <p className="text-xs text-muted">Total Letters</p>
        </NCard>
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {mostFrequent ? `${mostFrequent.letter} (${mostFrequent.count})` : "—"}
          </p>
          <p className="text-xs text-muted">Most Frequent</p>
        </NCard>
        <NCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {leastFrequent ? `${leastFrequent.letter} (${leastFrequent.count})` : "—"}
          </p>
          <p className="text-xs text-muted">Least Frequent</p>
        </NCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor label="Enter your text" value={text} onChange={setText} height="500px" />

        <div>
          <label className="mb-1.5 block text-sm font-medium">Letter Frequency (A-Z)</label>
          <div className="max-h-[500px] overflow-auto rounded-lg border border-default bg-surface">
            {totalLetters === 0 ? (
              <p className="p-4 text-center text-sm text-muted">Enter text to see letter frequency</p>
            ) : (
              rows.map((row) => (
                <div
                  key={row.letter}
                  className="flex items-center justify-between border-b border-default/50 px-3 py-2"
                >
                  <span className="w-6 text-sm font-medium text-foreground">{row.letter}</span>
                  <div className="flex flex-1 items-center gap-2 px-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent/20">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-muted">{row.count}</span>
                  <span className="w-14 text-right text-xs text-muted">
                    {totalLetters > 0 ? ((row.count / totalLetters) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterFrequencyAnalyzer;

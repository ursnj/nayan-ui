"use client";

import { useState, useMemo } from "react";
import { NCard, NTextarea, NInput, NBadge } from "@nayan-ui/react";

interface KeywordResult {
  word: string;
  count: number;
  density: number;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare",
  "it", "its", "this", "that", "these", "those", "i", "me", "my",
  "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "what", "which", "who", "whom", "where",
  "when", "how", "not", "no", "nor", "as", "if", "then", "than",
  "so", "just", "about", "up", "out", "into", "over", "after",
  "also", "very", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "only", "own", "same", "too",
]);

const KeywordDensityAnalyzer = () => {
  const [text, setText] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [minLength, setMinLength] = useState(3);

  const analysis = useMemo(() => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= minLength);

    const totalWords = words.length;
    if (totalWords === 0) return { totalWords: 0, uniqueWords: 0, keywords: [], targetResult: null };

    const freq: Record<string, number> = {};
    for (const w of words) {
      if (!STOP_WORDS.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }

    const keywords: KeywordResult[] = Object.entries(freq)
      .map(([word, count]) => ({
        word,
        count,
        density: (count / totalWords) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    let targetResult: KeywordResult | null = null;
    if (targetKeyword.trim()) {
      const target = targetKeyword.toLowerCase().trim();
      // Count actual occurrences in the raw text via a word-boundary regex,
      // independent of the STOP_WORDS/minLength filters above — those only
      // shape the "top keywords" list, but a user explicitly searching for
      // a target keyword (even a stop word, or one shorter than minLength)
      // should still get a real count rather than a silent 0.
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "g");
      const count = (text.toLowerCase().match(regex) || []).length;
      targetResult = {
        word: target,
        count,
        density: totalWords > 0 ? (count / totalWords) * 100 : 0,
      };
    }

    return {
      totalWords,
      uniqueWords: Object.keys(freq).length,
      keywords,
      targetResult,
    };
  }, [text, targetKeyword, minLength]);

  const maxCount = analysis.keywords[0]?.count || 1;

  const getDensityColor = (density: number): "success" | "warning" | "danger" | "default" => {
    if (density >= 1 && density <= 3) return "success";
    if (density > 3 && density <= 5) return "warning";
    if (density > 5) return "danger";
    return "default";
  };

  return (
    <div>
      <NTextarea
        label="Content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your article, blog post, or page content here to analyze keyword density..."
        textareaClassName="h-[200px] resize-none text-sm"
      />

      <div className="mt-6 mb-6 grid gap-3 sm:grid-cols-2">
        <NInput
          label="Target Keyword (optional)"
          value={targetKeyword}
          onChange={(e) => setTargetKeyword(e.target.value)}
          placeholder="e.g. react components"
        />
        <NInput
          label="Min Word Length"
          type="number"
          value={String(minLength)}
          onChange={(e) => setMinLength(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      {analysis.totalWords > 0 && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <NBadge size="sm">{analysis.totalWords} total words</NBadge>
            <NBadge size="sm">{analysis.uniqueWords} unique keywords</NBadge>
            <NBadge size="sm">
              {((analysis.uniqueWords / analysis.totalWords) * 100).toFixed(1)}% vocabulary density
            </NBadge>
          </div>

          {analysis.targetResult && (
            <NCard className="mb-6 p-4">
              <label className="mb-2 block text-sm font-semibold">Target Keyword Analysis</label>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-foreground">
                  &ldquo;{analysis.targetResult.word}&rdquo;
                </span>
                <NBadge size="sm">{analysis.targetResult.count}× found</NBadge>
                <NBadge size="sm" color={getDensityColor(analysis.targetResult.density)}>
                  {analysis.targetResult.density.toFixed(2)}% density
                </NBadge>
                {analysis.targetResult.density >= 1 && analysis.targetResult.density <= 3 ? (
                  <span className="text-xs text-success">✓ Optimal range (1-3%)</span>
                ) : analysis.targetResult.density > 3 ? (
                  <span className="text-xs text-warning">⚠ Consider reducing usage</span>
                ) : (
                  <span className="text-xs text-muted">↑ Consider increasing usage</span>
                )}
              </div>
            </NCard>
          )}

          <NCard className="p-4">
            <label className="mb-3 block text-sm font-semibold">Top Keywords</label>
            <div className="space-y-2">
              {analysis.keywords.map((kw) => (
                <div key={kw.word} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate font-mono text-xs text-foreground">
                    {kw.word}
                  </span>
                  <div className="flex-1">
                    <div className="h-4 w-full rounded-full bg-default/30">
                      <div
                        className="h-4 rounded-full bg-accent/60"
                        style={{ width: `${(kw.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs text-muted">{kw.count}×</span>
                  <NBadge size="sm" color={getDensityColor(kw.density)}>
                    {kw.density.toFixed(1)}%
                  </NBadge>
                </div>
              ))}
            </div>
          </NCard>
        </>
      )}
    </div>
  );
};

export default KeywordDensityAnalyzer;

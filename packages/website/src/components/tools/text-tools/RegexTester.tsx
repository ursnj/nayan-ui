"use client";

import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { NButton, NInput, NTextarea, NCard } from "@nayan-ui/react";

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

const RegexTester = () => {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchResult[], error: "" };
    try {
      const regex = new RegExp(pattern, flags);
      const results: MatchResult[] = [];
      if (flags.includes("g")) {
        let m;
        let guard = 0;
        while ((m = regex.exec(text)) !== null && guard++ < 10000) {
          results.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (m[0].length === 0) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(text);
        if (m) results.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      return { matches: results, error: "" };
    } catch (e: any) {
      return { matches: [] as MatchResult[], error: e.message || "Invalid regex" };
    }
  }, [pattern, flags, text]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => { setPattern(""); setFlags("g"); setText(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <NInput
            label="Regex Pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. \\d+|[a-z]+"
          />
        </div>
        <div className="w-24">
          <NInput
            label="Flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="gi"
          />
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <NTextarea
        label="Test String"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to test against the regex..."
        textareaClassName="h-[200px] resize-none font-mono text-sm"
      />

      {matches.length > 0 && (
        <NCard className="mt-4 p-4">
          <label className="mb-2 block text-sm font-medium">{matches.length} Match{matches.length !== 1 ? "es" : ""}</label>
          <div className="space-y-2">
            {matches.map((m, i) => (
              <div key={i} className="rounded-lg bg-default/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Index {m.index}</span>
                  {m.groups.length > 0 && <span>Groups: {m.groups.length}</span>}
                </div>
                <code className="block font-mono text-sm text-foreground">{m.match}</code>
                {m.groups.length > 0 && (
                  <div className="mt-1 text-xs text-muted">
                    {m.groups.map((g, gi) => (
                      <span key={gi} className="mr-3">
                        ${gi + 1}: <code className="text-foreground">{g}</code>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </NCard>
      )}

      {pattern && text && matches.length === 0 && !error && (
        <p className="mt-3 text-sm text-muted">No matches found</p>
      )}
    </div>
  );
};

export default RegexTester;

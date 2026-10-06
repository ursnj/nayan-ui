"use client";

import { useCallback, useState } from "react";
import { GitCompareArrows, Trash2 } from "lucide-react";
import { NButton, showToast } from "@nayan-ui/react";
import MonacoEditor from "../shared/MonacoEditor";

interface DiffLine {
  type: "equal" | "added" | "removed";
  text: string;
  lineNum: { left?: number; right?: number };
}

const computeDiff = (a: string, b: string): DiffLine[] => {
  const linesA = a.split("\n");
  const linesB = b.split("\n");

  const lcsMatrix: number[][] = Array.from({ length: linesA.length + 1 }, () =>
    Array(linesB.length + 1).fill(0),
  );
  for (let i = 1; i <= linesA.length; i++) {
    for (let j = 1; j <= linesB.length; j++) {
      lcsMatrix[i][j] =
        linesA[i - 1] === linesB[j - 1]
          ? lcsMatrix[i - 1][j - 1] + 1
          : Math.max(lcsMatrix[i - 1][j], lcsMatrix[i][j - 1]);
    }
  }

  let i = linesA.length;
  let j = linesB.length;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: "equal", text: linesA[i - 1], lineNum: { left: i, right: j } });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
      stack.push({ type: "added", text: linesB[j - 1], lineNum: { right: j } });
      j--;
    } else {
      stack.push({ type: "removed", text: linesA[i - 1], lineNum: { left: i } });
      i--;
    }
  }

  return stack.reverse();
};

const TextCompare = () => {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [stats, setStats] = useState<{ added: number; removed: number; unchanged: number } | null>(null);

  const compare = useCallback(() => {
    const linesA = left.split("\n").length;
    const linesB = right.split("\n").length;
    if (linesA * linesB > 4_000_000) {
      showToast("Text is too large to compare in the browser. Try smaller inputs.");
      return;
    }
    const result = computeDiff(left, right);
    setDiff(result);
    setStats({
      added: result.filter((l) => l.type === "added").length,
      removed: result.filter((l) => l.type === "removed").length,
      unchanged: result.filter((l) => l.type === "equal").length,
    });
  }, [left, right]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton onClick={compare}>
          <GitCompareArrows className="mr-2 h-4 w-4" />
          Compare
        </NButton>
        <NButton
          isOutline
          onClick={() => {
            setLeft("");
            setRight("");
            setDiff(null);
            setStats(null);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
        {stats && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-success">+{stats.added} added</span>
            <span className="text-danger">-{stats.removed} removed</span>
            <span className="text-muted">{stats.unchanged} unchanged</span>
          </div>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label="Original Text"
          value={left}
          onChange={setLeft}
          height="500px"
        />
        <MonacoEditor
          label="Modified Text"
          value={right}
          onChange={setRight}
          height="500px"
        />
      </div>

      {diff && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Diff Result</label>
          <div className="max-h-[500px] overflow-auto rounded-lg border border-default bg-surface font-mono text-sm">
            {diff.map((line, idx) => (
              <div
                key={idx}
                className={`flex border-b border-default/50 ${
                  line.type === "added"
                    ? "bg-success/10"
                    : line.type === "removed"
                      ? "bg-danger/10"
                      : ""
                }`}
              >
                <span className="w-10 shrink-0 select-none px-2 py-1 text-right text-xs text-muted">
                  {line.lineNum.left ?? ""}
                </span>
                <span className="w-10 shrink-0 select-none px-2 py-1 text-right text-xs text-muted">
                  {line.lineNum.right ?? ""}
                </span>
                <span className="w-6 shrink-0 select-none py-1 text-center text-xs font-bold">
                  {line.type === "added" ? (
                    <span className="text-success">+</span>
                  ) : line.type === "removed" ? (
                    <span className="text-danger">-</span>
                  ) : (
                    <span className="text-muted"> </span>
                  )}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all px-2 py-1">{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextCompare;

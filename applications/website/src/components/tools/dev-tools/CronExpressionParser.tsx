"use client";

import { useCallback, useState } from "react";
import { Clock3 } from "lucide-react";
import { NButton, NCard, NInput } from "@nayan-ui/react";

interface FieldRange {
  min: number;
  max: number;
}

const FIELD_RANGES: FieldRange[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 7 }, // day of week (7 is an alias for 0/Sunday)
];

type ParsedField = Set<number>;

function parseField(raw: string, min: number, max: number): ParsedField | { error: string } {
  const result = new Set<number>();
  const segments = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (segments.length === 0) return { error: "field cannot be empty" };

  for (const segment of segments) {
    const match = segment.match(/^(\*|\d+-\d+|\d+)(?:\/(\d+))?$/);
    if (!match) return { error: `invalid segment "${segment}"` };
    const [, base, stepStr] = match;
    const step = stepStr ? parseInt(stepStr, 10) : 1;
    if (step <= 0) return { error: `step must be positive in "${segment}"` };

    let rangeStart: number;
    let rangeEnd: number;
    if (base === "*") {
      rangeStart = min;
      rangeEnd = max;
    } else if (base.includes("-")) {
      const [a, b] = base.split("-").map(Number);
      if (a > b) return { error: `invalid range "${base}" (start greater than end)` };
      rangeStart = a;
      rangeEnd = b;
    } else {
      rangeStart = rangeEnd = Number(base);
    }

    if (rangeStart < min || rangeEnd > max) {
      return { error: `value out of range in "${segment}" (allowed ${min}-${max})` };
    }
    for (let v = rangeStart; v <= rangeEnd; v += step) result.add(v);
  }
  return result;
}

interface ParsedCron {
  minute: ParsedField;
  hour: ParsedField;
  dom: ParsedField;
  month: ParsedField;
  dow: ParsedField;
  domRaw: string;
  dowRaw: string;
  raw: { minute: string; hour: string; dom: string; month: string; dow: string };
}

function parseCron(expr: string): ParsedCron | { error: string } {
  const fields = expr.trim().split(/\s+/).filter(Boolean);
  if (fields.length !== 5) {
    return { error: `Expected 5 fields (minute hour day month weekday), got ${fields.length}` };
  }
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = fields;
  const names = ["Minute", "Hour", "Day of month", "Month", "Day of week"];
  const raws = [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw];
  const parsedFields: ParsedField[] = [];

  for (let i = 0; i < 5; i++) {
    const result = parseField(raws[i], FIELD_RANGES[i].min, FIELD_RANGES[i].max);
    if ("error" in result) return { error: `${names[i]}: ${result.error}` };
    parsedFields.push(result);
  }

  const dow = parsedFields[4];
  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }

  return {
    minute: parsedFields[0],
    hour: parsedFields[1],
    dom: parsedFields[2],
    month: parsedFields[3],
    dow,
    domRaw,
    dowRaw,
    raw: { minute: minuteRaw, hour: hourRaw, dom: domRaw, month: monthRaw, dow: dowRaw },
  };
}

function matches(date: Date, parsed: ParsedCron): boolean {
  if (!parsed.minute.has(date.getMinutes())) return false;
  if (!parsed.hour.has(date.getHours())) return false;
  if (!parsed.month.has(date.getMonth() + 1)) return false;

  const domWild = parsed.domRaw.trim() === "*";
  const dowWild = parsed.dowRaw.trim() === "*";
  const domMatch = parsed.dom.has(date.getDate());
  const dowMatch = parsed.dow.has(date.getDay());

  if (domWild && dowWild) return true;
  if (domWild) return dowMatch;
  if (dowWild) return domMatch;
  // Standard cron quirk: when BOTH day-of-month and day-of-week are
  // restricted, a date matches if EITHER one matches, not both.
  return domMatch || dowMatch;
}

const MAX_ITERATIONS = 60 * 24 * 366 * 2; // ~2 years of minutes

function nextRuns(parsed: ParsedCron, count: number): Date[] {
  const results: Date[] = [];
  const cur = new Date();
  cur.setSeconds(0, 0);
  cur.setMinutes(cur.getMinutes() + 1);

  let iterations = 0;
  while (results.length < count && iterations < MAX_ITERATIONS) {
    if (matches(cur, parsed)) results.push(new Date(cur));
    cur.setMinutes(cur.getMinutes() + 1);
    iterations++;
  }
  return results;
}

function describeMinuteHour(minute: string, hour: string): string {
  if (minute === "*" && hour === "*") return "every minute";
  if (minute.startsWith("*/") && hour === "*") return `every ${minute.slice(2)} minutes`;
  if (minute === "*" && hour.startsWith("*/")) return `every minute, every ${hour.slice(2)} hours`;
  if (hour === "*" && /^\d+$/.test(minute)) return `at minute ${minute} of every hour`;
  if (minute === "*") return `every minute during hour ${hour}`;
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    return `at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }
  return `at minute(s) ${minute}, hour(s) ${hour}`;
}

function describeCron(raw: ParsedCron["raw"]): string {
  const parts = [describeMinuteHour(raw.minute, raw.hour)];
  if (raw.dom !== "*") parts.push(`on day-of-month ${raw.dom}`);
  if (raw.month !== "*") parts.push(`in month ${raw.month}`);
  if (raw.dow !== "*") parts.push(`on day-of-week ${raw.dow} (0=Sunday)`);
  return parts.join(", ");
}

const CronExpressionParser = () => {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const [result, setResult] = useState<{ description: string; runs: Date[] } | null>(null);
  const [error, setError] = useState("");

  const parse = useCallback(() => {
    const parsed = parseCron(expr);
    if ("error" in parsed) {
      setError(parsed.error);
      setResult(null);
      return;
    }
    setError("");
    const runs = nextRuns(parsed, 5);
    setResult({
      description: describeCron(parsed.raw),
      runs,
    });
  }, [expr]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <NInput
          label="Cron Expression"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="*/15 9-17 * * 1-5"
          className="min-w-64 flex-1"
          inputClassName="font-mono"
        />
        <NButton onClick={parse}>
          <Clock3 className="mr-2 h-4 w-4" />
          Parse
        </NButton>
      </div>
      <p className="mb-4 text-xs text-muted">Fields: minute (0-59) hour (0-23) day-of-month (1-31) month (1-12) day-of-week (0-7, 0 and 7 = Sunday)</p>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {result && (
        <>
          <NCard className="mb-4 p-4">
            <span className="text-xs font-medium uppercase text-muted">Description</span>
            <p className="mt-1 text-sm text-foreground">{result.description}</p>
          </NCard>

          <NCard className="p-4">
            <span className="text-xs font-medium uppercase text-muted">Next {result.runs.length || ""} Run{result.runs.length === 1 ? "" : "s"}</span>
            {result.runs.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No matching run found in the next 2 years &mdash; this expression may be impossible (e.g. day-of-month 31 in a month with fewer days).</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {result.runs.map((d, i) => (
                  <li key={i} className="font-mono text-sm text-foreground">
                    {d.toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </NCard>
        </>
      )}
    </div>
  );
};

export default CronExpressionParser;

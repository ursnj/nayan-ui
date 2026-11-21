"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as engine from "@nayan-ui/engine";
import { BookOpen, Check, Play, RotateCcw, Share2 } from "@/design/Icons";
import Link from "next/link";
import { NSelect } from "@/components/ui";
import CodeEditor from "./CodeEditor";
import { createCompiler } from "./compiler";
import { evaluateExample } from "./evaluate";
import PreviewBoundary from "./PreviewBoundary";
import { PLAYGROUND_CATEGORIES, PLAYGROUND_EXAMPLES } from "./examples";

type Log = { level: "error" | "warn" | "log"; text: string };
type Option = { value: string; label: string };

/** The picker's options, grouped by category. */
const GROUPS = PLAYGROUND_CATEGORIES.map((category) => ({
  label: category,
  options: PLAYGROUND_EXAMPLES.filter((example) => example.category === category).map(
    (example) => ({ value: example.id, label: example.title }),
  ),
}));
const OPTIONS: Option[] = GROUPS.flatMap((group) => group.options);

const STORAGE_KEY = "nyn-engine-playground";
/** What the code may import: the engine and React, the same instances the page uses. */
const MODULES: Record<string, unknown> = {
  "@nayan-ui/engine": engine,
  react: React,
  "react/jsx-runtime": jsxRuntime,
};

const encode = (code: string) => btoa(unescape(encodeURIComponent(code)));
const decode = (text: string) => decodeURIComponent(escape(atob(text)));

/** The code in a shared link (#code=…), or null. */
function sharedCode(): string | null {
  try {
    const shared = new URLSearchParams(window.location.hash.slice(1)).get("code");
    return shared ? decode(shared) : null;
  } catch {
    return null;
  }
}

/** Copies text with the Clipboard API, or the older copy command where that's unavailable (non-HTTPS pages). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}

/** The code to open with: a shared link, then the last edit, then the first example. */
function initialCode() {
  try {
    const shared = sharedCode();
    if (shared) return shared;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {}
  return PLAYGROUND_EXAMPLES[0]!.code;
}

export default function Playground() {
  const [startingCode] = useState(initialCode);
  const [code, setCode] = useState(startingCode);
  const [Preview, setPreview] = useState<React.ComponentType | null>(null);
  const [run, setRun] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [shared, setShared] = useState<"copied" | "failed" | null>(null);
  const compiler = useRef<ReturnType<typeof createCompiler> | null>(null);
  const runRequest = useRef(0);

  const log = useCallback((level: Log["level"], ...args: unknown[]) => {
    const text = args
      .map((arg) =>
        arg instanceof Error ? arg.message : typeof arg === "string" ? arg : JSON.stringify(arg),
      )
      .join(" ");
    setLogs((current) => [...current.slice(-49), { level, text }]);
  }, []);

  const execute = useCallback(async (source: string) => {
    const currentCompiler = compiler.current;
    if (!currentCompiler) return;
    const request = ++runRequest.current;
    setLogs([]);
    try {
      const js = await currentCompiler.compile(source);
      if (compiler.current !== currentCompiler || request !== runRequest.current) return;
      const output = {
        ...console,
        log: (...args: unknown[]) => log("log", ...args),
        info: (...args: unknown[]) => log("log", ...args),
        warn: (...args: unknown[]) => log("warn", ...args),
        error: (...args: unknown[]) => log("error", ...args),
      };
      const component = evaluateExample(js, MODULES, output);
      setPreview(() => component);
      setRun((value) => value + 1);
    } catch (error) {
      if (compiler.current !== currentCompiler || request !== runRequest.current) return;
      setPreview(null);
      log("error", error);
    }
  }, [log]);

  useEffect(() => {
    try {
      const currentCompiler = createCompiler();
      compiler.current = currentCompiler;
      setReady(true);
      void execute(startingCode);
      return () => {
        compiler.current = null;
        currentCompiler.dispose();
      };
    } catch (error) {
      log("error", error);
    }
  }, [execute, log, startingCode]);

  useEffect(() => {
    const currentCompiler = compiler.current;
    if (!currentCompiler) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      currentCompiler.check(code).then(
        (messages) => { if (!cancelled) setProblems(messages); },
        (error: Error) => { if (!cancelled) setProblems([error.message]); },
      );
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  const complete = (source: string, position: number) =>
    compiler.current?.complete(source, position) ?? Promise.resolve([]);

  // Keep the last edit for the next visit.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  }, [code]);

  // The starter selected for this editing session; shared or saved custom code may have none.
  const [selected, setSelected] = useState<Option | null>(
    () =>
      OPTIONS.find(
        (option) =>
          PLAYGROUND_EXAMPLES.find((example) => example.id === option.value)?.code === code,
      ) ?? null,
  );
  const activeExample = PLAYGROUND_EXAMPLES.find((example) => example.id === selected?.value);
  const loadExample = (id: string) => {
    const example = PLAYGROUND_EXAMPLES.find((item) => item.id === id);
    if (!example) return;
    setSelected(OPTIONS.find((option) => option.value === id) ?? null);
    setCode(example.code);
    void execute(example.code);
  };

  // The link carries the code in its #hash. It goes in the address bar too, so it can be copied by hand.
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#code=${encodeURIComponent(encode(code))}`;
    window.history.replaceState(null, "", url);
    const copied = await copyText(url);
    setShared(copied ? "copied" : "failed");
    if (!copied)
      log("warn", "Couldn't copy the link automatically; copy it from the address bar:", url);
    setTimeout(() => setShared(null), 2500);
  };

  // A shared link opened in this tab (only the #hash changes, so the page doesn't reload): load its code.
  useEffect(() => {
    const open = () => {
      const incoming = sharedCode();
      if (!incoming) return;
      setCode(incoming);
      setSelected(
        OPTIONS.find(
          (option) =>
            PLAYGROUND_EXAMPLES.find((example) => example.id === option.value)?.code === incoming,
        ) ?? null,
      );
      void execute(incoming);
    };
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [execute]);

  // Island layout: the toolbar, editor, preview and console are separate floating cards.
  const island = "rounded-xl border border-border bg-surface shadow-sm";
  const button =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-default bg-background px-3 text-sm font-medium leading-none transition-colors hover:border-accent/40 disabled:opacity-50";
  const panelHeader =
    "flex h-8 shrink-0 items-center gap-2 border-b border-default px-3 text-xs font-medium text-muted";

  return (
    <div className="engine-playground flex flex-col gap-2 bg-background p-2">
      <div className={`${island} flex flex-wrap items-center gap-2 px-2 py-1.5`}>
        <h1 className="mx-1 flex h-8 items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-accent"
          />
          Engine playground
        </h1>
        <div className="w-52">
          <NSelect
            className="mb-0"
            aria-label="Load an example"
            placeholder="Load an example…"
            disabled={!ready}
            options={OPTIONS}
            value={selected}
            onChange={(option: Option | null) => option && loadExample(option.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => void execute(code)}
          disabled={!ready}
          className={`${button} border-transparent bg-accent text-accent-foreground hover:bg-accent/85 hover:border-transparent`}
          title="Run (Ctrl/Cmd + Enter)"
        >
          <Play aria-hidden className="h-4 w-4" /> Run
        </button>
        <button
          type="button"
          onClick={() => loadExample(selected?.value ?? PLAYGROUND_EXAMPLES[0]!.id)}
          disabled={!ready}
          className={button}
          title="Restore the selected example"
        >
          <RotateCcw aria-hidden className="h-4 w-4" /> Reset
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className={button}
          title="Copy a link to this code"
        >
          {shared === "copied" ? (
            <Check aria-hidden className="h-4 w-4 text-emerald-500" />
          ) : (
            <Share2 aria-hidden className="h-4 w-4" />
          )}
          {shared === "copied"
            ? "Link copied"
            : shared === "failed"
              ? "Link in address bar"
              : "Share"}
        </button>
        <Link href="/game-engine/api-reference" className={`${button} ml-auto`}>
          <BookOpen aria-hidden className="h-4 w-4" /> API reference
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-2 lg:grid-cols-2 lg:grid-rows-1">
        <section aria-label="Code" className={`${island} flex min-h-0 flex-col overflow-hidden`}>
          <div className={panelHeader}>
            <span className="font-mono">Playground.tsx</span>
            <span className="ml-auto hidden sm:inline">TypeScript · @nayan-ui/engine</span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor code={code} onChange={setCode} onRun={execute} onComplete={complete} />
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-2">
          <section
            aria-label="Preview"
            className={`${island} flex min-h-0 flex-1 flex-col overflow-hidden`}
          >
            <div className={panelHeader}>
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${Preview ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              <span className="truncate">{activeExample?.title ?? "Preview"}</span>
              {activeExample && (
                <span className="ml-auto shrink-0 text-muted">{activeExample.category}</span>
              )}
            </div>
            {activeExample && (
              <div className="shrink-0 border-b border-default px-4 py-3 text-sm">
                <p className="text-foreground">{activeExample.description}</p>
                <p className="mt-1 text-xs text-muted">{activeExample.instruction}</p>
              </div>
            )}
            <div className="relative flex min-h-0 flex-1 bg-slate-900">
              {Preview ? (
                <PreviewBoundary key={run} onError={(error) => log("error", error)}>
                  <div className="flex flex-1">
                    <Preview />
                  </div>
                </PreviewBoundary>
              ) : (
                <p className="m-auto text-sm text-slate-400">
                  {ready ? "Run the code to see it here." : "Loading the editor…"}
                </p>
              )}
            </div>
          </section>

          <section
            aria-label="Console"
            className={`${island} flex max-h-36 min-h-[4.75rem] flex-col overflow-hidden`}
          >
            <div className={panelHeader}>
              Console
              {problems.length + logs.length > 0 && (
                <span className="rounded-full bg-default px-2 py-0.5 text-[10px] font-semibold">
                  {problems.length + logs.length}
                </span>
              )}
            </div>
            <div className="overflow-y-auto px-3 py-1.5 font-mono text-xs" aria-live="polite">
              {problems.length === 0 && logs.length === 0 ? (
                <p className="text-muted">
                  No problems. Press Ctrl/Cmd + Enter to run or Ctrl/Cmd + Space for suggestions.
                </p>
              ) : (
                <>
                  {problems.map((problem) => (
                    <p key={problem} className="text-amber-600 dark:text-amber-400">
                      {problem}
                    </p>
                  ))}
                  {logs.map((entry, index) => (
                    <p
                      key={index}
                      className={
                        entry.level === "error"
                          ? "text-red-500"
                          : entry.level === "warn"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                      }
                    >
                      {entry.text}
                    </p>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

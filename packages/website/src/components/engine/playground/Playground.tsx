"use client";

import * as React from "react";
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as engine from "@nayan-ui/engine";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { BookOpen, Check, Play, RotateCcw, Share2 } from "lucide-react";
import Link from "next/link";
import { NSelect } from "@nayan-ui/react";
import { buildTheme, THEME_NAME } from "@/components/tools/shared/MonacoEditor";
import { PLAYGROUND_CATEGORIES, PLAYGROUND_EXAMPLES } from "./examples";

type Editor = Parameters<OnMount>[0];
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

/** The picker at the buttons' 32 px (NSelect's control is 40 px by default), its menu above the editor. */
const SELECT_STYLES = {
  control: (base: object) => ({
    ...base,
    minHeight: 32,
    height: 32,
    backgroundColor: "var(--background)",
  }), // the buttons' fill
  valueContainer: (base: object) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
  indicatorsContainer: (base: object) => ({ ...base, height: 30 }),
  dropdownIndicator: (base: object) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
  menuPortal: (base: object) => ({ ...base, zIndex: 60 }),
};

const FILE = "file:///Playground.tsx";
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

/** Monaco's TypeScript API (monaco.typescript in newer releases, languages.typescript before). */
const typescriptOf = (monaco: Monaco) => (monaco as any).typescript ?? monaco.languages.typescript;

/** Catches render errors in the user's component, so a bug shows in the panel instead of breaking the page. */
class Boundary extends Component<
  { onError: (error: Error) => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? (
      <p className="m-auto max-w-md p-6 text-center text-sm text-red-500">
        {this.state.error.message}
      </p>
    ) : (
      this.props.children
    );
  }
}

export default function Playground() {
  const [code, setCode] = useState<string>(() =>
    typeof window === "undefined" ? PLAYGROUND_EXAMPLES[0]!.code : initialCode(),
  );
  const [Preview, setPreview] = useState<React.ComponentType | null>(null);
  const [run, setRun] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [shared, setShared] = useState<"copied" | "failed" | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const log = useCallback((level: Log["level"], ...args: unknown[]) => {
    const text = args
      .map((arg) =>
        arg instanceof Error ? arg.message : typeof arg === "string" ? arg : JSON.stringify(arg),
      )
      .join(" ");
    setLogs((current) => [...current.slice(-49), { level, text }]);
  }, []);

  /** Compile the editor's code with Monaco's TypeScript worker, then run it and show its default export. */
  const execute = useCallback(async () => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    setLogs([]);
    try {
      const worker = await typescriptOf(monaco).getTypeScriptWorker();
      const client = await worker(model.uri);
      const output = await client.getEmitOutput(model.uri.toString());
      const js: string | undefined = output.outputFiles[0]?.text;
      if (!js) throw new Error("Nothing to run.");
      const module = { exports: {} as Record<string, unknown> };
      const require = (name: string) => {
        if (name in MODULES) return MODULES[name];
        throw new Error(`Only "@nayan-ui/engine" and "react" can be imported here, not "${name}".`);
      };
      const console = {
        log: (...args: unknown[]) => log("log", ...args),
        info: (...args: unknown[]) => log("log", ...args),
        warn: (...args: unknown[]) => log("warn", ...args),
        error: (...args: unknown[]) => log("error", ...args),
      };
      new Function("require", "module", "exports", "console", js)(
        require,
        module,
        module.exports,
        console,
      );
      const component = module.exports.default;
      if (typeof component !== "function")
        throw new Error("Export a React component as the default export.");
      setPreview(() => component as React.ComponentType);
      setRun((value) => value + 1);
    } catch (error) {
      setPreview(null);
      log("error", error);
    }
  }, [log]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      const applyTheme = () => {
        monaco.editor.defineTheme(
          THEME_NAME,
          buildTheme(document.documentElement.classList.contains("dark")),
        );
        monaco.editor.setTheme(THEME_NAME);
      };
      applyTheme();
      const observer = new MutationObserver(applyTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
      editor.onDidDispose(() => observer.disconnect());

      const ts = typescriptOf(monaco);
      ts.typescriptDefaults.setCompilerOptions({
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.ReactJSX,
        strict: true,
        esModuleInterop: true,
        allowNonTsExtensions: true,
        skipLibCheck: true,
        lib: ["es2020", "dom"],
      });
      // Problems in the code show in the editor and the panel; the engine's own files aren't checked.
      monaco.editor.onDidChangeMarkers(() => {
        type Marker = { severity: number; startLineNumber: number; message: string };
        const markers: Marker[] = monaco.editor.getModelMarkers({
          resource: monaco.Uri.parse(FILE),
        });
        setProblems(
          markers
            .filter((m) => m.severity >= monaco.MarkerSeverity.Error)
            .map((m) => `Line ${m.startLineNumber}: ${m.message}`),
        );
      });

      // Ctrl/Cmd + Enter runs the code.
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void execute());

      // The engine's and React's types, for autocomplete and type checking; then the first run.
      fetch("/game-engine/playground/types")
        .then(
          (response) => response.json() as Promise<{ libs: { path: string; content: string }[] }>,
        )
        .then(({ libs }) => {
          for (const lib of libs) ts.typescriptDefaults.addExtraLib(lib.content, lib.path);
        })
        .catch(() => log("warn", "Could not load the engine's types; autocomplete is limited."))
        .finally(() => {
          setReady(true);
          void execute();
        });
    },
    [execute, log],
  );

  // Keep the last edit for the next visit.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  }, [code]);

  // The example the editor opened with (Bouncing ball on a first visit); none for edited or shared code.
  const [selected, setSelected] = useState<Option | null>(
    () =>
      OPTIONS.find(
        (option) =>
          PLAYGROUND_EXAMPLES.find((example) => example.id === option.value)?.code === code,
      ) ?? null,
  );
  const loadExample = (id: string) => {
    const example = PLAYGROUND_EXAMPLES.find((item) => item.id === id);
    if (!example) return;
    setSelected(OPTIONS.find((option) => option.value === id) ?? null);
    setCode(example.code);
    editorRef.current?.setValue(example.code);
    void execute();
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
      if (!incoming || incoming === editorRef.current?.getValue()) return;
      setCode(incoming);
      setSelected(
        OPTIONS.find(
          (option) =>
            PLAYGROUND_EXAMPLES.find((example) => example.id === option.value)?.code === incoming,
        ) ?? null,
      );
      editorRef.current?.setValue(incoming);
      void execute();
    };
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [execute]);

  // Island layout: the toolbar, editor, preview and console are separate floating cards.
  const island = "rounded-2xl border border-default bg-surface shadow-sm";
  const button =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-default bg-background px-3 text-sm font-medium leading-none transition-colors hover:border-indigo-500/40 disabled:opacity-50";
  const panelHeader =
    "flex h-8 shrink-0 items-center gap-2 border-b border-default px-3 text-xs font-medium text-muted";

  return (
    <div className="flex h-[calc(100dvh-60px)] flex-col gap-2 bg-background p-2">
      <div className={`${island} flex flex-wrap items-center gap-2 px-2 py-1.5`}>
        <h1 className="mx-1 flex h-8 items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          />
          Engine playground
        </h1>
        <div className="w-52">
          {/* NSelect's control is h-10 in the library: shrunk to the buttons' 32 px, with no bottom margin. */}
          <NSelect
            className="mb-0"
            aria-label="Load an example"
            placeholder="Load an example…"
            isSearchable={false}
            options={GROUPS as unknown as Option[]}
            value={selected}
            onChange={(option: Option | null) => option && loadExample(option.value)}
            menuPortalTarget={document.body}
            styles={SELECT_STYLES}
          />
        </div>
        <button
          type="button"
          onClick={() => void execute()}
          disabled={!ready}
          className={`${button} border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/25 hover:border-transparent`}
          title="Run (Ctrl/Cmd + Enter)"
        >
          <Play aria-hidden className="h-4 w-4" /> Run
        </button>
        <button
          type="button"
          onClick={() => loadExample(PLAYGROUND_EXAMPLES[0]!.id)}
          className={button}
          title="Back to the first example"
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
            <Editor
              path={FILE}
              defaultLanguage="typescript"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              onMount={handleMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                tabSize: 2,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
              }}
            />
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
              Preview
            </div>
            <div className="relative flex min-h-0 flex-1 bg-slate-900">
              {Preview ? (
                <Boundary key={run} onError={(error) => log("error", error)}>
                  <div className="flex flex-1">
                    <Preview />
                  </div>
                </Boundary>
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
                  No problems. Edit the code, then press Run or Ctrl/Cmd + Enter.
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

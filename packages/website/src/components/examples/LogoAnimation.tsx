"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, Download, Pause, Play, RotateCcw } from "lucide-react";
import Code from "@/components/helpers/Code";
import { LOGOS, type LogoId } from "./logos";
import { BUTTON_SMALL, CARD } from "@/design/system";

type Logo = (typeof LOGOS)[number];

function SelectedLogo({ logo, code }: { logo: Logo; code: string }) {
  const [active, setActive] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [replay, setReplay] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState("");
  const preview = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // The code remains selectable when clipboard access is unavailable.
    }
  };

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!preference.matches);
    const onChange = () => setPlaying(!preference.matches);
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
  }, [logo.id]);

  useEffect(() => {
    setView("preview");
    setSpeed(1);
    setReplay(0);
    setCopied(false);
    setExporting(false);
    setProgress(0);
    setExportError("");
  }, [logo.id]);

  useEffect(() => {
    if (view !== "preview" || !preview.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(preview.current);
    return () => {
      observer.disconnect();
      setActive(false);
    };
  }, [view]);

  useEffect(() => {
    const sendControls = () =>
      frame.current?.contentWindow?.postMessage(
        {
          type: "logo-controls",
          logo: logo.id,
          playing,
          speed,
          replay,
          rendering: active && view === "preview",
        },
        window.location.origin,
      );
    const ready = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin)
        return;
      if (event.data?.type === "logo-ready") sendControls();
      if (event.data?.type === "logo-rendered") {
        setFrameReady(true);
        setInitialized(true);
      }
      if (event.data?.type === "logo-export-progress") setProgress(event.data.progress);
      if (event.data?.type === "logo-export-error") {
        setExporting(false);
        setExportError(event.data.message);
      }
      if (
        event.data?.type === "logo-export-complete" &&
        event.data.logo === logo.id &&
        event.data.data instanceof ArrayBuffer
      ) {
        const url = URL.createObjectURL(new Blob([event.data.data], { type: "image/webp" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${logo.id}-animation.webp`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExporting(false);
      }
    };
    window.addEventListener("message", ready);
    sendControls();
    return () => window.removeEventListener("message", ready);
  }, [active, playing, speed, replay, view, logo.id]);

  const exportAnimation = () => {
    setView("preview");
    setExporting(true);
    setProgress(0);
    setExportError("");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        frame.current?.contentWindow?.postMessage({ type: "logo-export" }, window.location.origin),
      ),
    );
  };

  const switchTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (exporting) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "preview"
        : event.key === "End"
          ? "code"
          : view === "preview"
            ? "code"
            : "preview";
    setView(next);
    document.getElementById(`${logo.id}-${next}-tab`)?.focus();
  };

  return (
    <section
      id="logo-stage"
      aria-labelledby={`${logo.id}-heading`}
      className="scroll-mt-24 space-y-4"
    >
      <div>
        <h2 id={`${logo.id}-heading`} className="text-xl font-semibold text-foreground">
          {logo.name}
        </h2>
        <p className="mt-2 text-sm text-muted">{logo.description}</p>
      </div>
      <div className={`${CARD} relative overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default p-2">
          <div role="tablist" aria-label={`${logo.name} example`} className="flex gap-1">
            {(["preview", "code"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`${logo.id}-${tab}-tab`}
                aria-selected={view === tab}
                aria-controls={`${logo.id}-${tab}-panel`}
                tabIndex={view === tab ? 0 : -1}
                disabled={exporting}
                onKeyDown={switchTab}
                onClick={() => setView(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${view === tab ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted hover:bg-default/50 hover:text-foreground"}`}
              >
                {tab === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={exportAnimation}
              disabled={!frameReady || exporting}
              aria-label={`Export ${logo.name} animated WebP`}
              aria-busy={exporting}
              title="Download an 8-second looping animated WebP (15 fps)"
              className={`${BUTTON_SMALL} gap-1.5 text-muted`}
            >
              <Download aria-hidden className="h-3.5 w-3.5" />
              {exporting ? (progress === 100 ? "Encoding…" : `${progress}%`) : "WebP"}
            </button>
            <button
              type="button"
              onClick={copyCode}
              aria-label={`Copy ${logo.name} code`}
              aria-live="polite"
              className={`${BUTTON_SMALL} gap-1.5 text-muted`}
            >
              {copied ? (
                <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy aria-hidden className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        {exportError ? (
          <p
            role="alert"
            className="border-b border-default px-4 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {exportError}
          </p>
        ) : null}
        <div
          role="tabpanel"
          id={`${logo.id}-preview-panel`}
          aria-labelledby={`${logo.id}-preview-tab`}
          aria-hidden={view !== "preview"}
          inert={view !== "preview"}
          className={
            view === "preview" ? "" : "pointer-events-none invisible absolute inset-x-0 top-0"
          }
          tabIndex={view === "preview" ? 0 : -1}
        >
          <div
            ref={preview}
            aria-label={`${logo.name} logo animation`}
            className="relative h-[300px] bg-[#0B1020] sm:h-[380px]"
          >
            {active && !frameReady && !initialized ? (
              <div
                role="status"
                className="absolute inset-0 flex items-center justify-center text-sm text-slate-300"
              >
                Loading Nayan Game Engine…
              </div>
            ) : null}
            <iframe
              ref={frame}
              src="/logo-preview/player"
              title={`${logo.name} animated preview`}
              className={`relative h-full w-full border-0 ${frameReady ? "opacity-100" : "opacity-0"}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-default p-4">
            <button type="button" className={BUTTON_SMALL} onClick={() => setPlaying(!playing)}>
              {playing ? (
                <Pause aria-hidden className="mr-2 h-4 w-4" />
              ) : (
                <Play aria-hidden className="mr-2 h-4 w-4" />
              )}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              onClick={() => {
                setReplay((value) => value + 1);
                setPlaying(true);
              }}
            >
              <RotateCcw aria-hidden className="mr-2 h-4 w-4" /> Replay
            </button>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Speed
              <select
                aria-label={`${logo.name} animation speed`}
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="rounded-lg border border-default bg-surface px-2 py-1.5 text-foreground"
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
            </label>
          </div>
        </div>
        <div
          role="tabpanel"
          id={`${logo.id}-code-panel`}
          aria-labelledby={`${logo.id}-code-tab`}
          hidden={view !== "code"}
          tabIndex={0}
          className="min-w-0"
        >
          {view === "code" ? (
            <Code
              embedded
              showHeader={false}
              maxHeight="min(55vh, 380px)"
              code={code}
              filename={`${logo.name.replace(/[^a-zA-Z0-9]/g, "")}LogoScene.tsx`}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function LogoAnimation({ sources }: { sources: Record<LogoId, string> }) {
  const [selected, setSelected] = useState<LogoId>("microsoft");
  const logo = LOGOS.find((item) => item.id === selected)!;
  return (
    <div className="space-y-6">
      <div role="group" aria-label="Choose company logo" className="flex flex-wrap gap-2">
        {LOGOS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            aria-controls="logo-stage"
            onClick={() => setSelected(item.id)}
            className={`${BUTTON_SMALL} ${selected === item.id ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <SelectedLogo logo={logo} code={sources[logo.id]} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, Pause, Play, RotateCcw } from "lucide-react";
import Code from "@/components/helpers/Code";
import { LOGOS, type LogoId } from "./logos";
import { BUTTON_SMALL, CARD } from "@/design/system";

type Logo = (typeof LOGOS)[number];

function LogoSection({
  logo,
  code,
  active,
  onVisibility,
}: {
  logo: Logo;
  code: string;
  active: boolean;
  onVisibility: (id: LogoId, ratio: number) => void;
}) {
  const [view, setView] = useState<"preview" | "code">("preview");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [replay, setReplay] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  const [copied, setCopied] = useState(false);
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
  }, []);

  useEffect(() => {
    if (view !== "preview" || !preview.current) return;
    // Only visible previews own a GPU surface; a long page must not exhaust browser contexts.
    const observer = new IntersectionObserver(
      ([entry]) => onVisibility(logo.id, entry.intersectionRatio),
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    observer.observe(preview.current);
    return () => {
      observer.disconnect();
      onVisibility(logo.id, 0);
    };
  }, [view, logo.id, onVisibility]);

  useEffect(() => {
    setFrameReady(false);
  }, [active, view]);

  useEffect(() => {
    const sendControls = () =>
      frame.current?.contentWindow?.postMessage(
        { type: "logo-controls", playing, speed, replay },
        window.location.origin,
      );
    const ready = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin)
        return;
      if (event.data?.type === "logo-ready") sendControls();
      if (event.data?.type === "logo-rendered") setFrameReady(true);
    };
    window.addEventListener("message", ready);
    sendControls();
    return () => window.removeEventListener("message", ready);
  }, [active, playing, speed, replay, view]);

  const switchTab = (event: KeyboardEvent<HTMLButtonElement>) => {
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
    <section id={logo.id} aria-labelledby={`${logo.id}-heading`} className="scroll-mt-24 space-y-4">
      <div>
        <h2 id={`${logo.id}-heading`} className="text-xl font-semibold text-foreground">
          {logo.name}
        </h2>
        <p className="mt-2 text-sm text-muted">{logo.description}</p>
      </div>
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between gap-2 border-b border-default p-2">
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
                onKeyDown={switchTab}
                onClick={() => setView(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${view === tab ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted hover:bg-default/50 hover:text-foreground"}`}
              >
                {tab === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
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
        <div
          role="tabpanel"
          id={`${logo.id}-preview-panel`}
          aria-labelledby={`${logo.id}-preview-tab`}
          hidden={view !== "preview"}
          tabIndex={0}
        >
          <div
            ref={preview}
            aria-label={`${logo.name} logo animation`}
            className="relative h-[300px] bg-[#0B1020] sm:h-[380px]"
          >
            <img
              src={`/logo-previews/${logo.id}.png`}
              alt={`${logo.name} logo`}
              width={902}
              height={460}
              loading="lazy"
              aria-hidden={active && frameReady}
              className="absolute inset-0 h-full w-full object-contain"
            />
            {active && !frameReady ? (
              <span role="status" className="sr-only">
                Loading logo preview…
              </span>
            ) : null}
            {view === "preview" && active ? (
              <iframe
                ref={frame}
                src={`/logo-preview/${logo.id}`}
                title={`${logo.name} animated preview`}
                className={`relative h-full w-full border-0 ${frameReady ? "opacity-100" : "opacity-0"}`}
              />
            ) : null}
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
  const [activeLogo, setActiveLogo] = useState<LogoId | null>(null);
  const ratios = useRef(new Map<LogoId, number>());
  const onVisibility = useCallback((id: LogoId, ratio: number) => {
    ratios.current.set(id, ratio);
    const visible = [...ratios.current.entries()]
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    setActiveLogo((current) => {
      const candidate = visible[0];
      if (!candidate) return null;
      const currentRatio = current ? (ratios.current.get(current) ?? 0) : 0;
      // Keep the current preview through small scroll movements near a section boundary.
      if (current && currentRatio > 0.2 && candidate[1] < currentRatio + 0.2) return current;
      return candidate[0];
    });
  }, []);
  return (
    <div className="space-y-10">
      <nav aria-label="Jump to logo" className="flex flex-wrap gap-2">
        {LOGOS.map((logo) => (
          <a key={logo.id} href={`#${logo.id}`} className={`${BUTTON_SMALL} text-muted`}>
            {logo.name}
          </a>
        ))}
      </nav>
      {LOGOS.map((logo) => (
        <LogoSection
          key={logo.id}
          logo={logo}
          code={sources[logo.id]}
          active={activeLogo === logo.id}
          onVisibility={onVisibility}
        />
      ))}
    </div>
  );
}

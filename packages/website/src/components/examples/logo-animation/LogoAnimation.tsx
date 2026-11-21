"use client";

import { NView, NText } from 'nayan-ui/components';
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, Orbit, Pause, Play, RotateCcw } from "@/design/Icons";
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
  const [rotateView, setRotateView] = useState(false);
  const [viewReset, setViewReset] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewError, setPreviewError] = useState("");
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
    setRotateView(false);
    setViewReset(0);
    setCopied(false);
    setPreviewError("");
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
          rotateView,
          viewReset,
          rendering: active && view === "preview",
          background: preview.current
            ? getComputedStyle(preview.current).backgroundColor
            : getComputedStyle(document.body).backgroundColor,
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
        setPreviewError("");
      }
      if (event.data?.type === "logo-error") setPreviewError(event.data.message);
    };
    window.addEventListener("message", ready);
    const themeObserver = new MutationObserver(sendControls);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    sendControls();
    return () => {
      window.removeEventListener("message", ready);
      themeObserver.disconnect();
    };
  }, [active, playing, speed, replay, rotateView, viewReset, view, logo.id]);

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
    <NView tag="section"
      id="logo-stage"
      aria-labelledby={`${logo.id}-heading`}
      className="scroll-mt-24 space-y-4"
    >
      <NView tag="div">
        <NText tag="h2" id={`${logo.id}-heading`} className="text-xl font-semibold text-foreground">
          {logo.name}
        </NText>
        <NText tag="p" className="mt-2 text-sm text-muted">{logo.description}</NText>
      </NView>
      <NView tag="div" className={`${CARD} relative overflow-hidden`}>
        <NView tag="div" className="flex flex-wrap items-center justify-between gap-2 border-b border-default p-2">
          <NView tag="div" role="tablist" aria-label={`${logo.name} example`} className="flex gap-1">
            {(["preview", "code"] as const).map((tab) => (
              <NView tag="button"
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
              </NView>
            ))}
          </NView>
          <NView tag="div" className="ml-auto flex items-center gap-2">
            <NView tag="button"
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
            </NView>
          </NView>
        </NView>
        {previewError ? (
          <NText tag="p"
            role="alert"
            className="border-b border-default px-4 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {previewError}
          </NText>
        ) : null}
        <NView tag="div"
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
          <NView tag="div"
            ref={preview}
            aria-label={`${logo.name} logo animation`}
            className="relative h-[300px] bg-background sm:h-[380px]"
          >
            {active && !frameReady && !initialized && !previewError ? (
              <NView tag="div"
                role="status"
                className="absolute inset-0 flex items-center justify-center text-sm text-muted"
              >
                Loading Nayan Game Engine…
              </NView>
            ) : null}
            <NView tag="iframe"
              ref={frame}
              src="/logo-preview/player"
              title={`${logo.name} animated preview`}
              className={`relative h-full w-full border-0 ${frameReady ? "opacity-100" : "opacity-0"}`}
            />
          </NView>
          <NView tag="div" className="flex flex-wrap items-center gap-3 border-t border-default p-4">
            <NView tag="button" type="button" className={BUTTON_SMALL} onClick={() => setPlaying(!playing)}>
              {playing ? (
                <Pause aria-hidden className="mr-2 h-4 w-4" />
              ) : (
                <Play aria-hidden className="mr-2 h-4 w-4" />
              )}
              {playing ? "Pause" : "Play"}
            </NView>
            <NView tag="button"
              type="button"
              className={BUTTON_SMALL}
              onClick={() => {
                setReplay((value) => value + 1);
                setPlaying(true);
              }}
            >
              <RotateCcw aria-hidden className="mr-2 h-4 w-4" /> Replay
            </NView>
            <NView tag="button"
              type="button"
              aria-pressed={rotateView}
              aria-controls={`${logo.id}-preview-panel`}
              disabled={!frameReady}
              title="Drag the preview to look around the 3D logo"
              className={`${BUTTON_SMALL} ${rotateView ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : ""}`}
              onClick={() => setRotateView((value) => !value)}
            >
              <Orbit aria-hidden className="mr-2 h-4 w-4" /> Rotate view
            </NView>
            {rotateView ? (
              <>
                <NView tag="button"
                  type="button"
                  className={BUTTON_SMALL}
                  onClick={() => setViewReset((value) => value + 1)}
                >
                  Front view
                </NView>
                <NText tag="span" className="text-xs text-muted">Drag or use arrow keys. Home resets.</NText>
              </>
            ) : null}
            <NView tag="label" className="ml-auto flex items-center gap-2 text-sm text-muted">
              Speed
              <NView<'select'> tag="select"
                aria-label={`${logo.name} animation speed`}
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="rounded-lg border border-default bg-surface px-2 py-1.5 text-foreground"
              >
                <NView tag="option" value={0.5}>0.5×</NView>
                <NView tag="option" value={1}>1×</NView>
                <NView tag="option" value={1.5}>1.5×</NView>
                <NView tag="option" value={2}>2×</NView>
              </NView>
            </NView>
          </NView>
        </NView>
        <NView tag="div"
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
        </NView>
      </NView>
    </NView>
  );
}

export default function LogoAnimation({ sources }: { sources: Record<LogoId, string> }) {
  const [selected, setSelected] = useState<LogoId>("microsoft");
  const logo = LOGOS.find((item) => item.id === selected) ?? LOGOS[0];
  return (
    <NView tag="div" className="space-y-6">
      <NView tag="div" role="group" aria-label="Choose company logo" className="flex flex-wrap gap-2">
        {LOGOS.map((item) => (
          <NView tag="button"
            key={item.id}
            type="button"
            aria-pressed={logo.id === item.id}
            aria-controls="logo-stage"
            onClick={() => setSelected(item.id)}
            className={`${BUTTON_SMALL} ${selected === item.id ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted"}`}
          >
            {item.name}
          </NView>
        ))}
      </NView>
      <SelectedLogo logo={logo} code={sources[logo.id]} />
    </NView>
  );
}

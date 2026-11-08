"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy, Pause, Play, RotateCcw } from "lucide-react";
import Code from "@/components/helpers/Code";
import { BUTTON_SMALL, CARD } from "@/design/system";
import { useTheme } from "@/components/helpers/ThemeProvider";
import type { PenguinAnim } from "./PenguinScene";
const PenguinScene = dynamic(() => import("./PenguinScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted" role="status">
      Loading the penguin…
    </div>
  ),
});

const ACTIONS: { id: PenguinAnim; label: string; description: string }[] = [
  {
    id: "idle",
    label: "Idle",
    description: "Breathing, glancing around, and little flipper twitches.",
  },
  {
    id: "walk",
    label: "Walking",
    description: "A gentle waddle with alternating feet and a shifting body.",
  },
  {
    id: "run",
    label: "Running",
    description: "A forward lean, quicker steps, and swinging flippers.",
  },
  {
    id: "jump",
    label: "Jumping",
    description: "Anticipation, take-off, an airborne flap, and a squash on landing.",
  },
  {
    id: "slide",
    label: "Sliding",
    description: "A belly slide with paddling flippers, followed by standing up.",
  },
  {
    id: "punch",
    label: "Punch",
    description: "A right-flipper strike with a wind-up and recovery.",
  },
  {
    id: "jab",
    label: "Jab",
    description: "A quick left-flipper jab with the other flipper guarding.",
  },
  { id: "hit", label: "Hit reaction", description: "A startled recoil, a wobble, and a recovery." },
  {
    id: "dance",
    label: "Dancing",
    description: "A looping victory dance with bouncing feet and waving flippers.",
  },
  {
    id: "dead",
    label: "Dying",
    description: "A dramatic, non-graphic fall that holds its final pose.",
  },
];

export default function PenguinAnimation({ source }: { source: string }) {
  const [action, setAction] = useState<PenguinAnim>("idle");
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const [replay, setReplay] = useState(0),
    [viewReset, setViewReset] = useState(0);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false),
    [active, setActive] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const dark = theme === "dark";
  const selected = ACTIONS.find((entry) => entry.id === action)!;
  const code = source.replace('action = "idle"', `action = "${action}"`);
  useEffect(() => {
    setPlaying(!matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "100px",
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Choose penguin action" className="flex flex-wrap gap-2">
        {ACTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={action === entry.id}
            aria-controls="penguin-stage"
            className={`${BUTTON_SMALL} ${action === entry.id ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted"}`}
            onClick={() => {
              setAction(entry.id);
              setReplay((value) => value + 1);
              setPlaying(true);
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <section
        id="penguin-stage"
        ref={stage}
        className={`${CARD} overflow-hidden`}
        aria-label="Interactive 3D penguin"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-semibold text-foreground">{selected.label}</h2>
            <p className="mt-1 text-sm text-muted">{selected.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Penguin example view"
              className="flex rounded-lg border border-default p-1"
            >
              {(["preview", "code"] as const).map((tab) => (
                <button
                  key={tab}
                  id={`penguin-${tab}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={view === tab}
                  aria-controls={`penguin-${tab}-panel`}
                  className={`rounded-md px-3 py-1 text-sm ${view === tab ? "bg-default/60 text-foreground" : "text-muted"}`}
                  onClick={() => setView(tab)}
                  onKeyDown={(event) => {
                    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
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
                      document.getElementById(`penguin-${next}-tab`)?.focus();
                    }
                  }}
                >
                  {tab === "preview" ? "Preview" : "Code"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={BUTTON_SMALL}
              aria-live="polite"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch {
                  setView("code");
                }
              }}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Copy className="mr-2 h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div
          id="penguin-preview-panel"
          role="tabpanel"
          aria-labelledby="penguin-preview-tab"
          hidden={view !== "preview"}
        >
          <div className="h-[390px] sm:h-[480px]">
            <PenguinScene
              action={action}
              playing={playing}
              rendering={active && view === "preview"}
              speed={speed}
              replay={replay}
              viewReset={viewReset}
              background={dark ? "#101d30" : "#eaf4fb"}
              groundColor={dark ? "#172b43" : "#dbeef7"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-default p-3 sm:px-5">
            <button
              type="button"
              className={BUTTON_SMALL}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? (
                <Pause className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Play className="mr-2 h-4 w-4" aria-hidden />
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
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
              Replay
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              onClick={() => setViewReset((value) => value + 1)}
            >
              Reset view
            </button>
            <span className="text-xs text-muted">Drag or use arrow keys to look around.</span>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Speed
              <select
                aria-label="Penguin animation speed"
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
          id="penguin-code-panel"
          role="tabpanel"
          aria-labelledby="penguin-code-tab"
          hidden={view !== "code"}
        >
          <Code code={code} embedded showHeader={false} maxHeight="420px" />
        </div>
      </section>
      <p className="text-xs leading-relaxed text-muted">
        Idle, walking, running, and dancing loop continuously. The other actions play once and hold
        their final pose.
      </p>
    </div>
  );
}

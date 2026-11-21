"use client";

import { type ReactNode, useState } from "react";
import {
  ComponentsRoot,
  NButton,
  NInput,
  NLoading,
  NPress,
  NText,
  NView,
} from "@nayan-ui/engine/components";
import { stylesheet } from "@/app/engine-styles";
import { BUTTON_SMALL } from "@/design/system";

const TABS = ["Buttons", "Forms", "Feedback", "Elements"] as const;
type Tab = (typeof TABS)[number];

const action = "rounded-lg bg-accent px-4 py-2 text-accent-foreground";
const row = "flex flex-row flex-wrap items-center gap-3";

export default function EnginePreview() {
  const [tab, setTab] = useState<Tab>("Buttons");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  let content: ReactNode;
  switch (tab) {
    case "Buttons":
      content = (
        <>
          <NText tag="p" className="text-sm text-muted">
            Try the primary button
          </NText>
          <NView tag="div" className={row}>
            <NButton
              type="button"
              onPress={() => setClicks((count) => count + 1)}
              className={action}
            >
              Primary
            </NButton>
            <NButton type="button" onPress={() => setClicks(0)} className={BUTTON_SMALL}>
              Reset
            </NButton>
          </NView>
          <NText tag="p" className="text-sm text-muted">
            {clicks === 1 ? "1 press" : `${clicks} presses`}
          </NText>
        </>
      );
      break;
    case "Forms":
      content = (
        <>
          <NText tag="p" className="text-sm font-semibold">
            Display name
          </NText>
          <NInput
            value={name}
            onChangeText={setName}
            accessibilityLabel="Display name"
            placeholder="Your name"
            className="engine-preview-input"
          />
          <NText tag="p" className="text-sm text-muted">
            {name.trim() ? `Hello, ${name.trim()}` : "Type a name to preview it here."}
          </NText>
        </>
      );
      break;
    case "Feedback":
      content = (
        <>
          <NView tag="div" className={row}>
            {loading && <NLoading size={20} />}
            <NText tag="p" className="text-sm">
              {loading ? "Loading preview" : "Preview complete"}
            </NText>
          </NView>
          <NView tag="div" className={row}>
            <NButton
              type="button"
              onPress={() => setLoading((pending) => !pending)}
              className={action}
            >
              {loading ? "Complete" : "Restart"}
            </NButton>
          </NView>
        </>
      );
      break;
    case "Elements":
      content = (
        <>
          <NText tag="p" className="text-sm font-semibold">
            Status labels
          </NText>
          <NView tag="div" className={row}>
            <NText className="rounded-lg bg-success/15 px-3 py-2 text-sm">Stable</NText>
            <NText className="rounded-lg bg-warning/15 px-3 py-2 text-sm">Beta</NText>
            <NText className="rounded-lg bg-accent/15 px-3 py-2 text-sm">New</NText>
          </NView>
        </>
      );
      break;
  }
  const preview = (
    <NView tag="div" className="engine-preview-content flex flex-col gap-4">
      {content}
    </NView>
  );

  return (
    <NView
      tag="section"
      aria-label="Engine component preview"
      className="min-w-0 overflow-hidden rounded-2xl border border-default bg-surface shadow-xl shadow-indigo-500/5"
    >
      <NView
        tag="div"
        className="flex items-center justify-between gap-3 border-b border-default px-4 py-3"
      >
        <NText className="font-mono text-xs text-muted">@nayan-ui/engine</NText>
        <NText className="text-xs text-muted">Component preview</NText>
      </NView>
      <NView tag="div" className="px-4 pt-4">
        <NView
          tag="div"
          role="group"
          aria-label="Component examples"
          className="grid grid-cols-2 gap-1 sm:grid-cols-4"
        >
          {TABS.map((item) => (
            <NPress
              key={item}
              aria-pressed={tab === item}
              onPress={() => setTab(item)}
              className={`${BUTTON_SMALL} flex-row px-1 aria-pressed:border-accent aria-pressed:text-accent`}
            >
              {item}
            </NPress>
          ))}
        </NView>
      </NView>
      <NView
        tag="div"
        className="relative m-4 h-[260px] overflow-hidden rounded-xl border border-default bg-background"
        data-engine-preview={status}
      >
        {status !== "ready" && preview}
        {status !== "fallback" && (
          <div
            className={`engine-preview-surface absolute inset-0 ${status === "ready" ? "" : "invisible"}`}
            inert={status !== "ready"}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            <ComponentsRoot
              background="transparent"
              stylesheet={stylesheet}
              style={{ height: "100%", width: "100%", minHeight: 0 }}
              onReady={() => setStatus("ready")}
              onError={(error) => {
                if (process.env.NODE_ENV === "development") console.warn("Engine preview:", error);
                setStatus("fallback");
              }}
            >
              {preview}
            </ComponentsRoot>
          </div>
        )}
      </NView>
    </NView>
  );
}

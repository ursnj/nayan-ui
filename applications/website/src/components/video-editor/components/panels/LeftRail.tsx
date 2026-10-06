import { useState } from "react";
import { cn } from "@nayan-ui/react";
import { Blend, FolderOpen, Image as ImageIcon, Sparkles, Type } from "lucide-react";
import { BackgroundPanel, EffectsPanel, TextPanel, TransitionsPanel } from "./LibraryPanels";
import { MediaPanel } from "./MediaPanel";

type PanelId = "media" | "text" | "effects" | "transitions" | "background";

const TABS: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "media", label: "Media", icon: <FolderOpen className="h-[18px] w-[18px]" /> },
  { id: "text", label: "Text", icon: <Type className="h-[18px] w-[18px]" /> },
  { id: "background", label: "Background", icon: <ImageIcon className="h-[18px] w-[18px]" /> },
  { id: "effects", label: "Effects", icon: <Sparkles className="h-[18px] w-[18px]" /> },
  { id: "transitions", label: "Transitions", icon: <Blend className="h-[18px] w-[18px]" /> },
];

export const LeftRail = () => {
  const [active, setActive] = useState<PanelId>("media");

  return (
    <div className="island flex h-full min-h-0">
      <nav
        aria-label="Editor panels"
        className="flex w-14 shrink-0 flex-col gap-1 border-r border-border bg-editor-chrome py-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-current={active === tab.id}
            className={cn(
              "relative mx-auto flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors",
              active === tab.id
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-default hover:text-foreground",
            )}
          >
            {active === tab.id && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
            )}
            {tab.icon}
            <span className="text-[9px] leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-editor-panel">
        {active === "media" && <MediaPanel />}
        {active === "text" && <TextPanel />}
        {active === "effects" && <EffectsPanel />}
        {active === "transitions" && <TransitionsPanel />}
        {active === "background" && <BackgroundPanel />}
      </div>
    </div>
  );
};
